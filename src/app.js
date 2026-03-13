require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const { apiReference } = require('@scalar/express');
const YAML = require('yamljs');

const stimuliRouter = require('./routes/stimuli');
const assessmentItemsRouter = require('./routes/assessmentItems');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ type: ['application/xml', 'text/xml'], limit: '10mb' }));

// ─── Serve OpenAPI spec ───────────────────────────────────────────────────────
const openApiPath = path.join(__dirname, '..', 'openapi.yaml');

app.get('/openapi.yaml', (req, res) => {
  res.setHeader('Content-Type', 'application/yaml');
  res.sendFile(openApiPath);
});

app.get('/openapi.json', (req, res) => {
  try {
    const spec = YAML.load(openApiPath);
    res.json(spec);
  } catch (err) {
    res.status(500).json({ error: 'Failed to parse OpenAPI spec', message: err.message });
  }
});

// ─── Scalar API Documentation ─────────────────────────────────────────────────
app.use(
  '/scalar',
  apiReference({
    spec: {
      url: '/openapi.yaml',
    },
    theme: 'default',
    layout: 'modern',
    defaultHttpClient: {
      targetKey: 'javascript',
      clientKey: 'fetch',
    },
    customCss: `
      :root {
        --scalar-color-1: #1a1a2e;
        --scalar-color-2: #16213e;
        --scalar-color-accent: #0f3460;
        --scalar-background-1: #ffffff;
        --scalar-background-2: #f8f9fa;
        --scalar-background-3: #e9ecef;
        --scalar-border-color: #dee2e6;
        --scalar-sidebar-background-1: #1a1a2e;
        --scalar-sidebar-color-1: #ffffff;
        --scalar-sidebar-color-2: #adb5bd;
        --scalar-sidebar-color-active: #e94560;
        --scalar-button-1: #e94560;
        --scalar-button-1-color: #ffffff;
        --scalar-button-1-hover: #c73652;
      }
    `,
  })
);

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/stimuli', stimuliRouter);
app.use('/api/assessment-items', assessmentItemsRouter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Root redirect to Scalar docs
app.get('/', (req, res) => res.redirect('/scalar'));

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'NotFound', message: `Route ${req.method} ${req.path} not found`, details: '' });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'InternalServerError', message: err.message, details: err.stack });
});

// ─── Database connection & server start ──────────────────────────────────────
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/qti';

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`Connected to MongoDB at ${MONGO_URI}`);

    app.listen(PORT, () => {
      console.log(`QTI API server running on http://localhost:${PORT}`);
      console.log(`Scalar docs available at http://localhost:${PORT}/scalar`);
      console.log(`OpenAPI spec available at http://localhost:${PORT}/openapi.yaml`);
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
}

start();

module.exports = app;
