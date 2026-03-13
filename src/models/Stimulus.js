const mongoose = require('mongoose');

const CatalogInfoSchema = new mongoose.Schema({
  id: { type: String, required: true },
  support: { type: String, required: true },
  content: { type: String, required: true },
});

const StylesheetSchema = new mongoose.Schema({
  href: { type: String, required: true },
  type: { type: String, required: true },
});

const StimulusSchema = new mongoose.Schema(
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
    catalogInfo: {
      type: [CatalogInfoSchema],
      default: [],
    },
    label: {
      type: String,
      trim: true,
    },
    language: {
      type: String,
      default: 'en',
    },
    stylesheet: StylesheetSchema,
    toolName: String,
    toolVersion: String,
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
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

// Text index for fuzzy search
StimulusSchema.index({ title: 'text', identifier: 'text' });

module.exports = mongoose.model('Stimulus', StimulusSchema);
