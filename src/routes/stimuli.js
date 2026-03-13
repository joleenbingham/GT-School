const express = require('express');
const router = express.Router();
const Stimulus = require('../models/Stimulus');
const { parseXml, buildStimulusXml } = require('../middleware/parseQti');

/**
 * Build a MongoDB query object from filter string.
 * Supports operators: =, !=, >, >=, <, <=, ~
 */
function buildFilterQuery(filterStr) {
  if (!filterStr) return {};
  const query = {};
  const expressions = filterStr.split(/\s+and\s+/i);
  for (const expr of expressions) {
    const match = expr.match(/^(\w+)\s*(>=|<=|!=|>|<|~|=)\s*(.+)$/);
    if (!match) continue;
    const [, field, op, value] = match;
    const parsed = isNaN(value) ? value.replace(/^["']|["']$/g, '') : Number(value);
    switch (op) {
      case '=': query[field] = parsed; break;
      case '!=': query[field] = { $ne: parsed }; break;
      case '>': query[field] = { $gt: parsed }; break;
      case '>=': query[field] = { $gte: parsed }; break;
      case '<': query[field] = { $lt: parsed }; break;
      case '<=': query[field] = { $lte: parsed }; break;
      case '~': query[field] = { $regex: parsed, $options: 'i' }; break;
    }
  }
  return query;
}

// GET /stimuli
router.get('/', async (req, res) => {
  try {
    const {
      query,
      page = '1',
      limit = '10',
      sort = 'createdAt',
      order = 'desc',
      filter,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;
    const sortDir = order === 'asc' ? 1 : -1;

    const mongoQuery = buildFilterQuery(filter);

    if (query) {
      mongoQuery.$or = [
        { title: { $regex: query, $options: 'i' } },
        { identifier: { $regex: query, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      Stimulus.find(mongoQuery)
        .sort({ [sort]: sortDir })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Stimulus.countDocuments(mongoQuery),
    ]);

    res.json({
      items,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      limit: limitNum,
      sort,
      order,
    });
  } catch (err) {
    res.status(500).json({ error: 'InternalServerError', message: err.message, details: err.stack });
  }
});

// POST /stimuli
router.post('/', async (req, res) => {
  try {
    let rawXml;
    let parsed;
    const body = req.body;

    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('application/xml') || contentType.includes('text/xml') || body.format === 'xml') {
      rawXml = typeof body === 'string' ? body : body.xml || body.rawXml;
      if (!rawXml) {
        return res.status(400).json({ error: 'ValidationError', message: 'XML body required', details: '' });
      }
      parsed = await parseXml(rawXml);
    } else {
      // JSON format: build XML from fields
      const { identifier, title, language, content, toolName, toolVersion } = body;
      if (!identifier || !title) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'identifier and title are required',
          details: '',
        });
      }
      rawXml = buildStimulusXml({ identifier, title, language, content, toolName, toolVersion });
      parsed = await parseXml(rawXml);
    }

    const root = parsed['qti-assessment-stimulus'];
    if (!root) {
      return res.status(400).json({ error: 'ValidationError', message: 'Invalid QTI stimulus XML', details: '' });
    }

    const attrs = root._attributes || {};
    const identifier = attrs.identifier || body.identifier;
    const title = attrs.title || body.title;

    if (!identifier || !title) {
      return res.status(400).json({ error: 'ValidationError', message: 'identifier and title are required', details: '' });
    }

    // Check for duplicate
    const existing = await Stimulus.findOne({ identifier });
    if (existing) {
      return res.status(409).json({ error: 'ConflictError', message: `Stimulus with identifier '${identifier}' already exists`, details: '' });
    }

    const stimulus = new Stimulus({
      identifier,
      title,
      label: attrs.label || body.label,
      language: attrs['xml:lang'] || body.language || 'en',
      toolName: attrs['tool-name'] || body.toolName,
      toolVersion: attrs['tool-version'] || body.toolVersion,
      catalogInfo: body.catalogInfo || [],
      stylesheet: body.stylesheet,
      metadata: body.metadata || {},
      rawXml,
      content: parsed,
    });

    await stimulus.save();
    res.status(201).json(stimulus.toObject());
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'ConflictError', message: 'Duplicate identifier', details: err.message });
    }
    res.status(500).json({ error: 'InternalServerError', message: err.message, details: err.stack });
  }
});

// GET /stimuli/:identifier
router.get('/:identifier', async (req, res) => {
  try {
    const stimulus = await Stimulus.findOne({ identifier: req.params.identifier }).lean();
    if (!stimulus) {
      return res.status(404).json({ error: 'NotFoundError', message: `Stimulus '${req.params.identifier}' not found`, details: '' });
    }
    res.json(stimulus);
  } catch (err) {
    res.status(500).json({ error: 'InternalServerError', message: err.message, details: err.stack });
  }
});

// PUT /stimuli/:identifier
router.put('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const body = req.body;
    const contentType = req.headers['content-type'] || '';

    let rawXml;
    let parsed;

    if (contentType.includes('application/xml') || contentType.includes('text/xml') || body.format === 'xml') {
      rawXml = typeof body === 'string' ? body : body.xml || body.rawXml;
      if (!rawXml) {
        return res.status(400).json({ error: 'ValidationError', message: 'XML body required', details: '' });
      }
      parsed = await parseXml(rawXml);
    } else {
      const { title, language, content, toolName, toolVersion } = body;
      const existing = await Stimulus.findOne({ identifier });
      if (!existing) {
        return res.status(404).json({ error: 'NotFoundError', message: `Stimulus '${identifier}' not found`, details: '' });
      }
      rawXml = buildStimulusXml({
        identifier,
        title: title || existing.title,
        language: language || existing.language,
        content,
        toolName: toolName || existing.toolName,
        toolVersion: toolVersion || existing.toolVersion,
      });
      parsed = await parseXml(rawXml);
    }

    const root = parsed['qti-assessment-stimulus'];
    if (!root) {
      return res.status(400).json({ error: 'ValidationError', message: 'Invalid QTI stimulus XML', details: '' });
    }

    const attrs = root._attributes || {};
    const updateData = {
      title: attrs.title || body.title,
      language: attrs['xml:lang'] || body.language,
      toolName: attrs['tool-name'] || body.toolName,
      toolVersion: attrs['tool-version'] || body.toolVersion,
      rawXml,
      content: parsed,
    };

    if (body.catalogInfo !== undefined) updateData.catalogInfo = body.catalogInfo;
    if (body.stylesheet !== undefined) updateData.stylesheet = body.stylesheet;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;
    if (body.label !== undefined) updateData.label = body.label;

    // Remove undefined fields
    Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);

    const stimulus = await Stimulus.findOneAndUpdate(
      { identifier },
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!stimulus) {
      return res.status(404).json({ error: 'NotFoundError', message: `Stimulus '${identifier}' not found`, details: '' });
    }

    res.json(stimulus);
  } catch (err) {
    res.status(500).json({ error: 'InternalServerError', message: err.message, details: err.stack });
  }
});

// DELETE /stimuli/:identifier
router.delete('/:identifier', async (req, res) => {
  try {
    const stimulus = await Stimulus.findOneAndDelete({ identifier: req.params.identifier });
    if (!stimulus) {
      return res.status(404).json({ error: 'NotFoundError', message: `Stimulus '${req.params.identifier}' not found`, details: '' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'InternalServerError', message: err.message, details: err.stack });
  }
});

module.exports = router;
