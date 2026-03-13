/**
 * Seed script – populates the database with the Spanish Language 1 course.
 *
 * Usage:
 *   MONGO_URI=mongodb://localhost:27017/qti node src/seeds/seed.js
 *
 * Options:
 *   --clear   Drop all existing stimuli, assessment items, and assessment tests
 *             before inserting fresh data.
 */

require('dotenv').config();
const mongoose = require('mongoose');

const Stimulus = require('../models/Stimulus');
const AssessmentItem = require('../models/AssessmentItem');
const AssessmentTest = require('../models/AssessmentTest');
const { stimuli, assessmentItems, assessmentTests } = require('./spanishL1Data');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/qti';
const CLEAR = process.argv.includes('--clear');

async function upsert(Model, docs, labelField = 'identifier') {
  let inserted = 0;
  let skipped = 0;
  for (const doc of docs) {
    const filter = { [labelField]: doc[labelField] };
    const existing = await Model.findOne(filter);
    if (existing) {
      if (CLEAR) {
        await Model.findOneAndReplace(filter, doc, { upsert: true, new: true });
        inserted++;
      } else {
        skipped++;
      }
    } else {
      await new Model(doc).save();
      inserted++;
    }
  }
  return { inserted, skipped };
}

async function run() {
  console.log(`Connecting to ${MONGO_URI}…`);
  await mongoose.connect(MONGO_URI);
  console.log('Connected.\n');

  if (CLEAR) {
    console.log('--clear flag detected. Removing existing course data…');
    await Stimulus.deleteMany({ 'metadata.course': 'Spanish Language 1' });
    await AssessmentItem.deleteMany({ 'metadata.subject': 'Spanish' });
    await AssessmentTest.deleteMany({ 'metadata.course': 'Spanish Language 1' });
    console.log('Cleared.\n');
  }

  console.log('Seeding stimuli…');
  const stimRes = await upsert(Stimulus, stimuli);
  console.log(`  ✓ ${stimRes.inserted} inserted, ${stimRes.skipped} skipped\n`);

  console.log('Seeding assessment items…');
  const itemRes = await upsert(AssessmentItem, assessmentItems);
  console.log(`  ✓ ${itemRes.inserted} inserted, ${itemRes.skipped} skipped\n`);

  console.log('Seeding assessment tests…');
  const testRes = await upsert(AssessmentTest, assessmentTests);
  console.log(`  ✓ ${testRes.inserted} inserted, ${testRes.skipped} skipped\n`);

  const totalItems = assessmentItems.length;
  console.log('─────────────────────────────────────────');
  console.log('Spanish Language 1 course seeded!');
  console.log(`  Units (Assessment Tests): ${assessmentTests.length}`);
  console.log(`  Stimuli (Reading Passages): ${stimuli.length}`);
  console.log(`  Assessment Items: ${totalItems}`);
  console.log('  Breakdown by unit:');
  console.log('    Unit 1 – Saludos y Presentaciones   (5 items)');
  console.log('    Unit 2 – Los Números y la Hora       (5 items)');
  console.log('    Unit 3 – La Familia                  (5 items)');
  console.log('    Unit 4 – La Comida                   (5 items)');
  console.log('    Unit 5 – En la Ciudad                (5 items)');
  console.log('─────────────────────────────────────────\n');

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
