const express = require('express');
const router = express.Router();
const AssessmentTest = require('../models/AssessmentTest');
const AssessmentItem = require('../models/AssessmentItem');
const { parseXml } = require('../middleware/parseQti');

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function buildTestXml(test) {
  const parts = (test['qti-test-part'] || []).map(part => {
    const sections = (part['qti-assessment-section'] || []).map(sec => {
      const refs = (sec['qti-assessment-item-ref'] || []).map(
        r => `    <qti-assessment-item-ref identifier="${r.identifier}" href="${r.href || ''}"/>`
      ).join('\n');
      return `  <qti-assessment-section identifier="${sec.identifier}" title="${sec.title}" visible="${sec.visible !== false}">\n${refs}\n  </qti-assessment-section>`;
    }).join('\n');
    return `<qti-test-part identifier="${part.identifier}" navigation-mode="${part.navigationMode || 'linear'}" submission-mode="${part.submissionMode || 'individual'}">\n${sections}\n</qti-test-part>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test
  xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd"
  identifier="${test.identifier}"
  title="${test.title}">
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0.0</qti-value></qti-default-value>
  </qti-outcome-declaration>
  ${parts}
</qti-assessment-test>`;
}

// ─── GET /assessment-tests ────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { query, page = '1', limit = '10', sort = 'createdAt', order = 'desc', filter } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const mongoQuery = buildFilterQuery(filter);
    if (query) {
      mongoQuery.$or = [
        { title: { $regex: query, $options: 'i' } },
        { identifier: { $regex: query, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      AssessmentTest.find(mongoQuery).sort({ [sort]: order === 'asc' ? 1 : -1 }).skip(skip).limit(limitNum).lean(),
      AssessmentTest.countDocuments(mongoQuery),
    ]);

    res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum), limit: limitNum, sort, order });
  } catch (err) {
    res.status(500).json({ error: 'InternalServerError', message: err.message, details: err.stack });
  }
});

// ─── POST /assessment-tests ───────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    const contentType = req.headers['content-type'] || '';

    let rawXml;
    let parsed;

    if (contentType.includes('application/xml') || contentType.includes('text/xml') || body.format === 'xml') {
      rawXml = typeof body === 'string' ? body : body.xml || body.rawXml;
      if (!rawXml) return res.status(400).json({ error: 'ValidationError', message: 'XML body required', details: '' });
      parsed = await parseXml(rawXml);
    } else {
      if (!body.identifier || !body.title) {
        return res.status(400).json({ error: 'ValidationError', message: 'identifier and title are required', details: '' });
      }
      rawXml = buildTestXml(body);
      parsed = await parseXml(rawXml);
    }

    const identifier = body.identifier || parsed?.['qti-assessment-test']?._attributes?.identifier;
    const title = body.title || parsed?.['qti-assessment-test']?._attributes?.title;

    const existing = await AssessmentTest.findOne({ identifier });
    if (existing) return res.status(409).json({ error: 'ConflictError', message: `Assessment test '${identifier}' already exists`, details: '' });

    const test = new AssessmentTest({
      identifier,
      title,
      qtiVersion: body.qtiVersion || '3.0',
      toolName: body.toolName,
      toolVersion: body.toolVersion,
      timeLimit: body.timeLimit,
      maxAttempts: body.maxAttempts,
      toolsEnabled: body.toolsEnabled || {},
      metadata: body.metadata || {},
      'qti-outcome-declaration': body['qti-outcome-declaration'] || [],
      'qti-test-part': body['qti-test-part'] || [],
      rawXml,
      content: parsed,
    });

    await test.save();
    res.status(201).json(test.toObject());
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'ConflictError', message: 'Duplicate identifier', details: err.message });
    res.status(500).json({ error: 'InternalServerError', message: err.message, details: err.stack });
  }
});

// ─── GET /assessment-tests/:identifier ───────────────────────────────────────
router.get('/:identifier', async (req, res) => {
  try {
    const test = await AssessmentTest.findOne({ identifier: req.params.identifier }).lean();
    if (!test) return res.status(404).json({ error: 'NotFoundError', message: `Assessment test '${req.params.identifier}' not found`, details: '' });
    res.json(test);
  } catch (err) {
    res.status(500).json({ error: 'InternalServerError', message: err.message, details: err.stack });
  }
});

// ─── GET /assessment-tests/:identifier/questions ──────────────────────────────
router.get('/:identifier/questions', async (req, res) => {
  try {
    const test = await AssessmentTest.findOne({ identifier: req.params.identifier }).lean();
    if (!test) return res.status(404).json({ error: 'NotFoundError', message: `Assessment test '${req.params.identifier}' not found`, details: '' });

    // Collect all item identifiers from sections
    const identifiers = [];
    for (const part of test['qti-test-part'] || []) {
      for (const section of part['qti-assessment-section'] || []) {
        for (const ref of section['qti-assessment-item-ref'] || []) {
          identifiers.push(ref.identifier);
        }
      }
    }

    const items = await AssessmentItem.find({ identifier: { $in: identifiers } }).lean();
    res.json({ items, total: items.length });
  } catch (err) {
    res.status(500).json({ error: 'InternalServerError', message: err.message, details: err.stack });
  }
});

// ─── PUT /assessment-tests/:identifier ───────────────────────────────────────
router.put('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const body = req.body;
    const rawXml = buildTestXml({ ...body, identifier });
    const parsed = await parseXml(rawXml);

    const update = { rawXml, content: parsed };
    const fields = ['title', 'qtiVersion', 'toolName', 'toolVersion', 'timeLimit', 'maxAttempts', 'toolsEnabled', 'metadata', 'qti-outcome-declaration', 'qti-test-part'];
    for (const f of fields) if (body[f] !== undefined) update[f] = body[f];

    const test = await AssessmentTest.findOneAndUpdate({ identifier }, { $set: update }, { new: true, runValidators: true }).lean();
    if (!test) return res.status(404).json({ error: 'NotFoundError', message: `Assessment test '${identifier}' not found`, details: '' });
    res.json(test);
  } catch (err) {
    res.status(500).json({ error: 'InternalServerError', message: err.message, details: err.stack });
  }
});

// ─── DELETE /assessment-tests/:identifier ─────────────────────────────────────
router.delete('/:identifier', async (req, res) => {
  try {
    const test = await AssessmentTest.findOneAndDelete({ identifier: req.params.identifier });
    if (!test) return res.status(404).json({ error: 'NotFoundError', message: `Assessment test '${req.params.identifier}' not found`, details: '' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'InternalServerError', message: err.message, details: err.stack });
  }
});

// ─── Test Part sub-routes ─────────────────────────────────────────────────────

// GET /assessment-tests/:id/test-parts
router.get('/:identifier/test-parts', async (req, res) => {
  try {
    const test = await AssessmentTest.findOne({ identifier: req.params.identifier }).lean();
    if (!test) return res.status(404).json({ error: 'NotFoundError', message: 'Assessment test not found', details: '' });
    const parts = test['qti-test-part'] || [];
    res.json({ items: parts, total: parts.length });
  } catch (err) {
    res.status(500).json({ error: 'InternalServerError', message: err.message, details: err.stack });
  }
});

// POST /assessment-tests/:id/test-parts
router.post('/:identifier/test-parts', async (req, res) => {
  try {
    const test = await AssessmentTest.findOne({ identifier: req.params.identifier });
    if (!test) return res.status(404).json({ error: 'NotFoundError', message: 'Assessment test not found', details: '' });

    const part = req.body;
    test['qti-test-part'].push(part);
    await test.save();
    res.status(201).json(part);
  } catch (err) {
    res.status(500).json({ error: 'InternalServerError', message: err.message, details: err.stack });
  }
});

// GET /assessment-tests/:id/test-parts/:partId
router.get('/:identifier/test-parts/:partIdentifier', async (req, res) => {
  try {
    const test = await AssessmentTest.findOne({ identifier: req.params.identifier }).lean();
    if (!test) return res.status(404).json({ error: 'NotFoundError', message: 'Assessment test not found', details: '' });
    const part = (test['qti-test-part'] || []).find(p => p.identifier === req.params.partIdentifier);
    if (!part) return res.status(404).json({ error: 'NotFoundError', message: 'Test part not found', details: '' });
    res.json(part);
  } catch (err) {
    res.status(500).json({ error: 'InternalServerError', message: err.message, details: err.stack });
  }
});

// DELETE /assessment-tests/:id/test-parts/:partId
router.delete('/:identifier/test-parts/:partIdentifier', async (req, res) => {
  try {
    const test = await AssessmentTest.findOne({ identifier: req.params.identifier });
    if (!test) return res.status(404).json({ error: 'NotFoundError', message: 'Assessment test not found', details: '' });
    const parts = test['qti-test-part'] || [];
    const idx = parts.findIndex(p => p.identifier === req.params.partIdentifier);
    if (idx === -1) return res.status(404).json({ error: 'NotFoundError', message: 'Test part not found', details: '' });
    parts.splice(idx, 1);
    await test.save();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'InternalServerError', message: err.message, details: err.stack });
  }
});

// ─── Section sub-routes ───────────────────────────────────────────────────────

// GET /assessment-tests/:id/test-parts/:partId/sections
router.get('/:identifier/test-parts/:partIdentifier/sections', async (req, res) => {
  try {
    const test = await AssessmentTest.findOne({ identifier: req.params.identifier }).lean();
    if (!test) return res.status(404).json({ error: 'NotFoundError', message: 'Assessment test not found', details: '' });
    const part = (test['qti-test-part'] || []).find(p => p.identifier === req.params.partIdentifier);
    if (!part) return res.status(404).json({ error: 'NotFoundError', message: 'Test part not found', details: '' });
    const sections = part['qti-assessment-section'] || [];
    res.json({ items: sections, total: sections.length });
  } catch (err) {
    res.status(500).json({ error: 'InternalServerError', message: err.message, details: err.stack });
  }
});

// POST /assessment-tests/:id/test-parts/:partId/sections
router.post('/:identifier/test-parts/:partIdentifier/sections', async (req, res) => {
  try {
    const test = await AssessmentTest.findOne({ identifier: req.params.identifier });
    if (!test) return res.status(404).json({ error: 'NotFoundError', message: 'Assessment test not found', details: '' });
    const part = (test['qti-test-part'] || []).find(p => p.identifier === req.params.partIdentifier);
    if (!part) return res.status(404).json({ error: 'NotFoundError', message: 'Test part not found', details: '' });
    part['qti-assessment-section'].push(req.body);
    await test.save();
    res.status(201).json(req.body);
  } catch (err) {
    res.status(500).json({ error: 'InternalServerError', message: err.message, details: err.stack });
  }
});

// POST /assessment-tests/:id/test-parts/:partId/sections/:sectionId/items
router.post('/:identifier/test-parts/:partIdentifier/sections/:sectionIdentifier/items', async (req, res) => {
  try {
    const test = await AssessmentTest.findOne({ identifier: req.params.identifier });
    if (!test) return res.status(404).json({ error: 'NotFoundError', message: 'Assessment test not found', details: '' });
    const part = (test['qti-test-part'] || []).find(p => p.identifier === req.params.partIdentifier);
    if (!part) return res.status(404).json({ error: 'NotFoundError', message: 'Test part not found', details: '' });
    const section = (part['qti-assessment-section'] || []).find(s => s.identifier === req.params.sectionIdentifier);
    if (!section) return res.status(404).json({ error: 'NotFoundError', message: 'Section not found', details: '' });
    section['qti-assessment-item-ref'].push(req.body);
    await test.save();
    res.status(201).json(req.body);
  } catch (err) {
    res.status(500).json({ error: 'InternalServerError', message: err.message, details: err.stack });
  }
});

// DELETE /assessment-tests/:id/test-parts/:partId/sections/:sectionId/items/:itemId
router.delete('/:identifier/test-parts/:partIdentifier/sections/:sectionIdentifier/items/:itemIdentifier', async (req, res) => {
  try {
    const test = await AssessmentTest.findOne({ identifier: req.params.identifier });
    if (!test) return res.status(404).json({ error: 'NotFoundError', message: 'Assessment test not found', details: '' });
    const part = (test['qti-test-part'] || []).find(p => p.identifier === req.params.partIdentifier);
    if (!part) return res.status(404).json({ error: 'NotFoundError', message: 'Test part not found', details: '' });
    const section = (part['qti-assessment-section'] || []).find(s => s.identifier === req.params.sectionIdentifier);
    if (!section) return res.status(404).json({ error: 'NotFoundError', message: 'Section not found', details: '' });
    const refs = section['qti-assessment-item-ref'];
    const idx = refs.findIndex(r => r.identifier === req.params.itemIdentifier);
    if (idx === -1) return res.status(404).json({ error: 'NotFoundError', message: 'Item reference not found', details: '' });
    refs.splice(idx, 1);
    await test.save();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'InternalServerError', message: err.message, details: err.stack });
  }
});

module.exports = router;
