const express = require('express');
const router = express.Router();
const AssessmentItem = require('../models/AssessmentItem');
const { parseXml, buildAssessmentItemXml } = require('../middleware/parseQti');

/**
 * Build a MongoDB query from a filter expression string.
 * Supports: =, !=, >, >=, <, <=, ~
 */
function buildFilterQuery(filterStr) {
  if (!filterStr) return {};
  const query = {};
  const expressions = filterStr.split(/\s+and\s+/i);
  for (const expr of expressions) {
    const match = expr.match(/^([\w.]+)\s*(>=|<=|!=|>|<|~|=)\s*(.+)$/);
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

// GET /assessment-items
router.get('/', async (req, res) => {
  try {
    const {
      query,
      page = '1',
      limit = '10',
      sort = 'createdAt',
      order = 'desc',
      filter,
      subject,
      grade,
      type,
      search,
    } = req.query;

    // Validate sort field
    const validSortFields = ['title', 'identifier', 'type', 'createdAt', 'updatedAt'];
    if (sort && !validSortFields.includes(sort)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: `Invalid sort field. Must be one of: ${validSortFields.join(', ')}`,
        details: '',
        issues: [{ field: 'sort', message: 'Invalid sort field' }],
      });
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;
    const sortDir = order === 'asc' ? 1 : -1;

    const mongoQuery = buildFilterQuery(filter);

    // Fuzzy search on title and identifier
    if (query) {
      mongoQuery.$or = [
        { title: { $regex: query, $options: 'i' } },
        { identifier: { $regex: query, $options: 'i' } },
      ];
    }

    // Full-text search on prompt/content
    if (search) {
      mongoQuery.$or = mongoQuery.$or || [];
      mongoQuery.$or.push({ rawXml: { $regex: search, $options: 'i' } });
    }

    // Convenience filters
    if (subject) mongoQuery['metadata.subject'] = { $regex: subject, $options: 'i' };
    if (grade) mongoQuery['metadata.grade'] = grade;
    if (type) mongoQuery.type = type;

    const [items, total] = await Promise.all([
      AssessmentItem.find(mongoQuery)
        .sort({ [sort]: sortDir })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AssessmentItem.countDocuments(mongoQuery),
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

// POST /assessment-items
router.post('/', async (req, res) => {
  try {
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
      // JSON (experimental) — build XML from fields
      const { identifier, title, language, timeDependent, adaptive, toolName, toolVersion } = body;
      if (!identifier || !title) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'identifier and title are required',
          details: '',
          issues: [
            ...(!identifier ? [{ field: 'identifier', message: 'Required' }] : []),
            ...(!title ? [{ field: 'title', message: 'Required' }] : []),
          ],
        });
      }
      rawXml = buildAssessmentItemXml({ identifier, title, language, timeDependent, adaptive, toolName, toolVersion });
      parsed = await parseXml(rawXml);
    }

    const root = parsed['qti-assessment-item'];
    if (!root) {
      return res.status(400).json({ error: 'ValidationError', message: 'Invalid QTI assessment item XML', details: '' });
    }

    const attrs = root._attributes || {};
    const identifier = attrs.identifier || body.identifier;
    const title = attrs.title || body.title;

    if (!identifier || !title) {
      return res.status(400).json({ error: 'ValidationError', message: 'identifier and title are required', details: '' });
    }

    const existing = await AssessmentItem.findOne({ identifier });
    if (existing) {
      return res.status(409).json({
        error: 'ConflictError',
        message: `AssessmentItem with identifier '${identifier}' already exists`,
        details: '',
      });
    }

    const item = new AssessmentItem({
      identifier,
      title,
      type: body.type,
      qtiVersion: body.qtiVersion || '3.0',
      timeDependent: attrs['time-dependent'] === 'true' || body.timeDependent || false,
      adaptive: attrs.adaptive === 'true' || body.adaptive || false,
      stimulusRef: body.stimulusRef,
      responseDeclarations: body.responseDeclarations || [],
      outcomeDeclarations: body.outcomeDeclarations || [],
      responseProcessing: body.responseProcessing,
      modalFeedback: body.modalFeedback || [],
      inlineFeedback: body.inlineFeedback || [],
      blockFeedback: body.blockFeedback || [],
      metadata: body.metadata || {},
      rawXml,
      content: parsed,
    });

    await item.save();
    res.status(201).json(item.toObject());
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'ConflictError', message: 'Duplicate identifier', details: err.message });
    }
    res.status(500).json({ error: 'InternalServerError', message: err.message, details: err.stack });
  }
});

// GET /assessment-items/:identifier
router.get('/:identifier', async (req, res) => {
  try {
    const item = await AssessmentItem.findOne({ identifier: req.params.identifier }).lean();
    if (!item) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: `AssessmentItem '${req.params.identifier}' not found`,
        details: '',
      });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'InternalServerError', message: err.message, details: err.stack });
  }
});

// PUT /assessment-items/:identifier
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
      const existing = await AssessmentItem.findOne({ identifier });
      if (!existing) {
        return res.status(404).json({ error: 'NotFoundError', message: `AssessmentItem '${identifier}' not found`, details: '' });
      }
      rawXml = buildAssessmentItemXml({
        identifier,
        title: body.title || existing.title,
        language: body.language || 'en',
        timeDependent: body.timeDependent !== undefined ? body.timeDependent : existing.timeDependent,
        adaptive: body.adaptive !== undefined ? body.adaptive : existing.adaptive,
        toolName: body.toolName || existing.toolName,
        toolVersion: body.toolVersion || existing.toolVersion,
      });
      parsed = await parseXml(rawXml);
    }

    const root = parsed['qti-assessment-item'];
    if (!root) {
      return res.status(400).json({ error: 'ValidationError', message: 'Invalid QTI assessment item XML', details: '' });
    }

    const attrs = root._attributes || {};
    const updateData = {
      title: attrs.title || body.title,
      timeDependent: attrs['time-dependent'] === 'true' || body.timeDependent,
      adaptive: attrs.adaptive === 'true' || body.adaptive,
      rawXml,
      content: parsed,
    };

    const optionalFields = [
      'type', 'qtiVersion', 'stimulusRef', 'responseDeclarations',
      'outcomeDeclarations', 'responseProcessing', 'modalFeedback',
      'inlineFeedback', 'blockFeedback', 'metadata',
    ];
    for (const field of optionalFields) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }

    // Remove undefined
    Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);

    const item = await AssessmentItem.findOneAndUpdate(
      { identifier },
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!item) {
      return res.status(404).json({ error: 'NotFoundError', message: `AssessmentItem '${identifier}' not found`, details: '' });
    }

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'InternalServerError', message: err.message, details: err.stack });
  }
});

// DELETE /assessment-items/:identifier
router.delete('/:identifier', async (req, res) => {
  try {
    const item = await AssessmentItem.findOneAndDelete({ identifier: req.params.identifier });
    if (!item) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: `AssessmentItem '${req.params.identifier}' not found`,
        details: '',
      });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'InternalServerError', message: err.message, details: err.stack });
  }
});

module.exports = router;
