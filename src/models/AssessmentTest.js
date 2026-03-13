const mongoose = require('mongoose');

const ItemRefSchema = new mongoose.Schema(
  {
    identifier: { type: String, required: true },
    href: String,
    sequence: Number,
  },
  { _id: false }
);

const SectionSchema = new mongoose.Schema(
  {
    identifier: { type: String, required: true },
    title: { type: String, required: true },
    visible: { type: Boolean, default: true },
    required: { type: Boolean, default: true },
    fixed: { type: Boolean, default: false },
    sequence: Number,
    'qti-assessment-item-ref': { type: [ItemRefSchema], default: [] },
  },
  { _id: false }
);

const TestPartSchema = new mongoose.Schema(
  {
    identifier: { type: String, required: true },
    navigationMode: {
      type: String,
      enum: ['linear', 'nonlinear'],
      default: 'linear',
    },
    submissionMode: {
      type: String,
      enum: ['individual', 'simultaneous'],
      default: 'individual',
    },
    'qti-assessment-section': { type: [SectionSchema], default: [] },
  },
  { _id: false }
);

const OutcomeDeclarationSchema = new mongoose.Schema(
  {
    identifier: { type: String, required: true },
    cardinality: { type: String, enum: ['single', 'multiple', 'ordered', 'record'], default: 'single' },
    baseType: String,
    normalMaximum: Number,
    normalMinimum: Number,
    defaultValue: mongoose.Schema.Types.Mixed,
  },
  { _id: false }
);

const AssessmentTestSchema = new mongoose.Schema(
  {
    identifier: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    qtiVersion: { type: String, default: '3.0' },
    toolName: String,
    toolVersion: String,
    timeLimit: Number,
    maxAttempts: Number,
    toolsEnabled: { type: mongoose.Schema.Types.Mixed, default: {} },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    'qti-outcome-declaration': { type: [OutcomeDeclarationSchema], default: [] },
    'qti-test-part': { type: [TestPartSchema], default: [] },
    rawXml: String,
    content: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
    versionKey: '__v',
  }
);

AssessmentTestSchema.index({ title: 'text', identifier: 'text' });

module.exports = mongoose.model('AssessmentTest', AssessmentTestSchema);
