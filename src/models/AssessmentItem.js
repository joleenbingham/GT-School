const mongoose = require('mongoose');

const ResponseDeclarationSchema = new mongoose.Schema(
  {
    identifier: { type: String, required: true },
    cardinality: {
      type: String,
      enum: ['single', 'multiple', 'ordered', 'record'],
      required: true,
    },
    baseType: {
      type: String,
      enum: [
        'boolean',
        'directedPair',
        'duration',
        'file',
        'float',
        'identifier',
        'integer',
        'pair',
        'point',
        'string',
        'uri',
      ],
    },
    correctResponse: mongoose.Schema.Types.Mixed,
    mapping: mongoose.Schema.Types.Mixed,
    areaMapping: mongoose.Schema.Types.Mixed,
  },
  { _id: false }
);

const OutcomeDeclarationSchema = new mongoose.Schema(
  {
    identifier: { type: String, required: true },
    cardinality: {
      type: String,
      enum: ['single', 'multiple', 'ordered', 'record'],
      required: true,
    },
    baseType: String,
    defaultValue: mongoose.Schema.Types.Mixed,
    interpretation: String,
    externalScored: String,
    normalMaximum: Number,
    normalMinimum: Number,
    masteryValue: Number,
  },
  { _id: false }
);

const FeedbackSchema = new mongoose.Schema(
  {
    identifier: String,
    outcomeIdentifier: String,
    showHide: { type: String, enum: ['show', 'hide'] },
    content: mongoose.Schema.Types.Mixed,
  },
  { _id: false }
);

const AssessmentItemMetadataSchema = new mongoose.Schema(
  {
    subject: String,
    grade: String,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
    },
    learningObjectives: [String],
    dok: Number,
    standard: String,
    language: { type: String, default: 'en' },
  },
  { _id: false }
);

const AssessmentItemSchema = new mongoose.Schema(
  {
    identifier: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'choice',
        'text-entry',
        'extended-text',
        'inline-choice',
        'match',
        'associate',
        'order',
        'hotspot',
        'select-point',
        'graphic-order',
        'graphic-associate',
        'graphic-gap-match',
        'position-object',
        'slider',
        'drawing',
        'upload',
        'custom',
      ],
    },
    qtiVersion: {
      type: String,
      default: '3.0',
    },
    timeDependent: {
      type: Boolean,
      default: false,
    },
    adaptive: {
      type: Boolean,
      default: false,
    },
    stimulusRef: {
      type: String,
      ref: 'Stimulus',
    },
    responseDeclarations: {
      type: [ResponseDeclarationSchema],
      default: [],
    },
    outcomeDeclarations: {
      type: [OutcomeDeclarationSchema],
      default: [],
    },
    responseProcessing: mongoose.Schema.Types.Mixed,
    modalFeedback: {
      type: [FeedbackSchema],
      default: [],
    },
    inlineFeedback: {
      type: [FeedbackSchema],
      default: [],
    },
    blockFeedback: {
      type: [FeedbackSchema],
      default: [],
    },
    metadata: AssessmentItemMetadataSchema,
    rawXml: {
      type: String,
      required: true,
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: '__v',
  }
);

// Text index for search
AssessmentItemSchema.index({ title: 'text', identifier: 'text' });
// Field indexes for filtering
AssessmentItemSchema.index({ 'metadata.subject': 1 });
AssessmentItemSchema.index({ 'metadata.grade': 1 });
AssessmentItemSchema.index({ type: 1 });

module.exports = mongoose.model('AssessmentItem', AssessmentItemSchema);
