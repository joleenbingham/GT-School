/**
 * Spanish Language 1 – Complete QTI 3.0 course seed data.
 *
 * Units:
 *   1. Saludos y Presentaciones  (Greetings & Introductions)
 *   2. Los Números y la Hora     (Numbers & Time)
 *   3. La Familia                (Family)
 *   4. La Comida                 (Food)
 *   5. En la Ciudad              (In the City)
 *
 * Each unit contains:
 *   - 1 reading stimulus
 *   - 5 assessment items (mix of choice, text-entry, inline-choice, extended-text)
 *   - 1 assessment test that groups the items
 */

// ─── Helper builders ──────────────────────────────────────────────────────────

function choiceItem({ identifier, title, prompt, choices, correctId, subject = 'Spanish', grade = '9', difficulty = 'easy' }) {
  const choiceXml = choices.map(c =>
    `      <qti-simple-choice identifier="${c.id}">${c.text}</qti-simple-choice>`
  ).join('\n');

  const rawXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item
  xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asistv3p0_v1p0.xsd"
  identifier="${identifier}"
  title="${title}"
  xml:lang="en"
  time-dependent="false"
  adaptive="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>${correctId}</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0.0</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" shuffle="true" max-choices="1">
      <qti-prompt>${prompt}</qti-prompt>
${choiceXml}
    </qti-choice-interaction>
  </qti-item-body>
  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct"/>
</qti-assessment-item>`;

  return {
    identifier,
    title,
    type: 'choice',
    metadata: { subject, grade, difficulty },
    rawXml,
    content: { note: 'choice-item' },
  };
}

function textEntryItem({ identifier, title, beforeText, afterText = '', correctAnswer, subject = 'Spanish', grade = '9', difficulty = 'easy' }) {
  const rawXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item
  xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asistv3p0_v1p0.xsd"
  identifier="${identifier}"
  title="${title}"
  xml:lang="en"
  time-dependent="false"
  adaptive="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string">
    <qti-correct-response>
      <qti-value>${correctAnswer}</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0.0</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-item-body>
    <p>${beforeText} <qti-text-entry-interaction response-identifier="RESPONSE" expected-length="25"/> ${afterText}</p>
  </qti-item-body>
  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct"/>
</qti-assessment-item>`;

  return {
    identifier,
    title,
    type: 'text-entry',
    metadata: { subject, grade, difficulty },
    rawXml,
    content: { note: 'text-entry-item' },
  };
}

function inlineChoiceItem({ identifier, title, beforeText, choices, correctId, afterText = '', subject = 'Spanish', grade = '9', difficulty = 'medium' }) {
  const optionsXml = choices.map(c =>
    `      <qti-inline-choice identifier="${c.id}">${c.text}</qti-inline-choice>`
  ).join('\n');

  const rawXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item
  xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asistv3p0_v1p0.xsd"
  identifier="${identifier}"
  title="${title}"
  xml:lang="en"
  time-dependent="false"
  adaptive="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>${correctId}</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0.0</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-item-body>
    <p>${beforeText}
      <qti-inline-choice-interaction response-identifier="RESPONSE" shuffle="false">
${optionsXml}
      </qti-inline-choice-interaction>
    ${afterText}</p>
  </qti-item-body>
  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct"/>
</qti-assessment-item>`;

  return {
    identifier,
    title,
    type: 'inline-choice',
    metadata: { subject, grade, difficulty },
    rawXml,
    content: { note: 'inline-choice-item' },
  };
}

function extendedTextItem({ identifier, title, prompt, subject = 'Spanish', grade = '9', difficulty = 'hard' }) {
  const rawXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item
  xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asistv3p0_v1p0.xsd"
  identifier="${identifier}"
  title="${title}"
  xml:lang="en"
  time-dependent="false"
  adaptive="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"/>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0.0</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-item-body>
    <qti-extended-text-interaction response-identifier="RESPONSE" max-strings="1" expected-lines="5">
      <qti-prompt>${prompt}</qti-prompt>
    </qti-extended-text-interaction>
  </qti-item-body>
</qti-assessment-item>`;

  return {
    identifier,
    title,
    type: 'extended-text',
    metadata: { subject, grade, difficulty },
    rawXml,
    content: { note: 'extended-text-item' },
  };
}

function stimulus({ identifier, title, bodyHtml, language = 'en' }) {
  const rawXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-stimulus
  xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asistv3p0_v1p0.xsd"
  identifier="${identifier}"
  title="${title}"
  xml:lang="${language}"
  tool-name="SpanishL1-Seed"
  tool-version="1.0">
  <qti-stimulus-body>
${bodyHtml}
  </qti-stimulus-body>
</qti-assessment-stimulus>`;

  return {
    identifier,
    title,
    language,
    catalogInfo: [],
    toolName: 'SpanishL1-Seed',
    toolVersion: '1.0',
    metadata: { subject: 'Spanish', course: 'Spanish Language 1' },
    rawXml,
    content: { note: 'stimulus' },
  };
}

function assessmentTest({ identifier, title, parts }) {
  const partsXml = parts.map(part => {
    const sectionsXml = part.sections.map(sec => {
      const refsXml = sec.items.map(
        id => `        <qti-assessment-item-ref identifier="${id}" href="/api/assessment-items/${id}"/>`
      ).join('\n');
      return `    <qti-assessment-section identifier="${sec.identifier}" title="${sec.title}" visible="true">
${refsXml}
    </qti-assessment-section>`;
    }).join('\n');
    return `  <qti-test-part identifier="${part.identifier}" navigation-mode="linear" submission-mode="individual">
${sectionsXml}
  </qti-test-part>`;
  }).join('\n');

  const rawXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test
  xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd"
  identifier="${identifier}"
  title="${title}">
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0.0</qti-value></qti-default-value>
  </qti-outcome-declaration>
${partsXml}
</qti-assessment-test>`;

  const testParts = parts.map(part => ({
    identifier: part.identifier,
    navigationMode: 'linear',
    submissionMode: 'individual',
    'qti-assessment-section': part.sections.map(sec => ({
      identifier: sec.identifier,
      title: sec.title,
      visible: true,
      'qti-assessment-item-ref': sec.items.map(id => ({
        identifier: id,
        href: `/api/assessment-items/${id}`,
      })),
    })),
  }));

  return {
    identifier,
    title,
    qtiVersion: '3.0',
    toolName: 'SpanishL1-Seed',
    toolVersion: '1.0',
    metadata: { subject: 'Spanish', grade: '9', course: 'Spanish Language 1' },
    'qti-outcome-declaration': [{ identifier: 'SCORE', cardinality: 'single', baseType: 'float', normalMaximum: 5.0, normalMinimum: 0.0, defaultValue: { value: 0.0 } }],
    'qti-test-part': testParts,
    rawXml,
    content: { note: 'assessment-test' },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNIT 1 – Saludos y Presentaciones
// ═══════════════════════════════════════════════════════════════════════════════

const unit1Stimulus = stimulus({
  identifier: 'stimulus-esp1-unit1-greetings',
  title: 'Diálogo: Saludos y Presentaciones',
  language: 'es',
  bodyHtml: `    <div class="stimulus-content">
      <h2>Diálogo: Nuevos Amigos</h2>
      <p><strong>Ana:</strong> ¡Buenos días! Me llamo Ana. ¿Cómo te llamas tú?</p>
      <p><strong>Carlos:</strong> ¡Hola! Me llamo Carlos. Mucho gusto.</p>
      <p><strong>Ana:</strong> Igualmente. ¿De dónde eres?</p>
      <p><strong>Carlos:</strong> Soy de México. ¿Y tú?</p>
      <p><strong>Ana:</strong> Soy de España. ¡Hasta luego!</p>
      <p><strong>Carlos:</strong> ¡Adiós!</p>
      <hr/>
      <h3>Vocabulario útil</h3>
      <ul>
        <li><em>Buenos días</em> – Good morning</li>
        <li><em>Buenas tardes</em> – Good afternoon</li>
        <li><em>Buenas noches</em> – Good evening / Good night</li>
        <li><em>Hola</em> – Hello</li>
        <li><em>Adiós / Hasta luego</em> – Goodbye / See you later</li>
        <li><em>Me llamo…</em> – My name is…</li>
        <li><em>¿Cómo te llamas?</em> – What is your name?</li>
        <li><em>Mucho gusto / Igualmente</em> – Nice to meet you / Likewise</li>
        <li><em>¿De dónde eres?</em> – Where are you from?</li>
        <li><em>Soy de…</em> – I am from…</li>
      </ul>
    </div>`,
});

const unit1Items = [
  choiceItem({
    identifier: 'esp1-u1-q1-buenos-dias',
    title: 'Meaning of "Buenos días"',
    prompt: 'What does "Buenos días" mean in English?',
    choices: [
      { id: 'a', text: 'Good afternoon' },
      { id: 'b', text: 'Good morning' },
      { id: 'c', text: 'Good evening' },
      { id: 'd', text: 'Good night' },
    ],
    correctId: 'b',
    difficulty: 'easy',
  }),
  textEntryItem({
    identifier: 'esp1-u1-q2-me-llamo',
    title: 'Fill in: Me llamo',
    beforeText: 'Complete the sentence: "Me _____ Sofía."',
    correctAnswer: 'llamo',
    difficulty: 'easy',
  }),
  choiceItem({
    identifier: 'esp1-u1-q3-formal-greeting',
    title: 'Formal vs. Informal Greeting',
    prompt: 'Which greeting would be most appropriate when meeting your teacher for the first time?',
    choices: [
      { id: 'a', text: '¡Hola! ¿Qué tal?' },
      { id: 'b', text: '¡Buenos días! Mucho gusto.' },
      { id: 'c', text: '¡Buenas! ¿Cómo estás?' },
      { id: 'd', text: '¡Hey!' },
    ],
    correctId: 'b',
    difficulty: 'medium',
  }),
  inlineChoiceItem({
    identifier: 'esp1-u1-q4-despedida',
    title: 'Choosing the right farewell',
    beforeText: 'It is midnight and you are saying goodbye to a friend. You say: "',
    choices: [
      { id: 'a', text: 'Buenos días' },
      { id: 'b', text: 'Buenas noches' },
      { id: 'c', text: 'Buenas tardes' },
      { id: 'd', text: 'Buen provecho' },
    ],
    correctId: 'b',
    afterText: '"',
    difficulty: 'easy',
  }),
  extendedTextItem({
    identifier: 'esp1-u1-q5-presentacion',
    title: 'Write a self-introduction in Spanish',
    prompt: 'Write 3–4 sentences introducing yourself in Spanish. Include your name, where you are from, and one greeting. Use vocabulary from the dialogue above.',
    difficulty: 'hard',
  }),
];

const unit1Test = assessmentTest({
  identifier: 'esp1-unit1-saludos',
  title: 'Spanish 1 – Unit 1: Saludos y Presentaciones',
  parts: [{
    identifier: 'unit1-main-part',
    sections: [
      {
        identifier: 'unit1-vocabulary-section',
        title: 'Vocabulary & Comprehension',
        items: ['esp1-u1-q1-buenos-dias', 'esp1-u1-q2-me-llamo', 'esp1-u1-q3-formal-greeting', 'esp1-u1-q4-despedida'],
      },
      {
        identifier: 'unit1-production-section',
        title: 'Written Production',
        items: ['esp1-u1-q5-presentacion'],
      },
    ],
  }],
});

// ═══════════════════════════════════════════════════════════════════════════════
// UNIT 2 – Los Números y la Hora
// ═══════════════════════════════════════════════════════════════════════════════

const unit2Stimulus = stimulus({
  identifier: 'stimulus-esp1-unit2-numbers',
  title: 'Los Números y la Hora',
  language: 'es',
  bodyHtml: `    <div class="stimulus-content">
      <h2>Los Números del 0 al 100</h2>
      <table border="1" cellpadding="6">
        <tr><th>Número</th><th>Español</th><th>Número</th><th>Español</th></tr>
        <tr><td>0</td><td>cero</td><td>10</td><td>diez</td></tr>
        <tr><td>1</td><td>uno</td><td>11</td><td>once</td></tr>
        <tr><td>2</td><td>dos</td><td>12</td><td>doce</td></tr>
        <tr><td>3</td><td>tres</td><td>13</td><td>trece</td></tr>
        <tr><td>4</td><td>cuatro</td><td>14</td><td>catorce</td></tr>
        <tr><td>5</td><td>cinco</td><td>15</td><td>quince</td></tr>
        <tr><td>6</td><td>seis</td><td>20</td><td>veinte</td></tr>
        <tr><td>7</td><td>siete</td><td>30</td><td>treinta</td></tr>
        <tr><td>8</td><td>ocho</td><td>40</td><td>cuarenta</td></tr>
        <tr><td>9</td><td>nueve</td><td>100</td><td>cien</td></tr>
      </table>
      <h3>La Hora</h3>
      <p>To tell time in Spanish:</p>
      <ul>
        <li><em>¿Qué hora es?</em> – What time is it?</li>
        <li><em>Es la una.</em> – It is 1:00.</li>
        <li><em>Son las dos.</em> – It is 2:00.</li>
        <li><em>Son las tres y media.</em> – It is 3:30.</li>
        <li><em>Son las cuatro y cuarto.</em> – It is 4:15.</li>
        <li><em>Son las cinco menos cuarto.</em> – It is 4:45.</li>
      </ul>
    </div>`,
});

const unit2Items = [
  choiceItem({
    identifier: 'esp1-u2-q1-quince',
    title: 'Number: quince',
    prompt: 'What number is "quince" in Spanish?',
    choices: [
      { id: 'a', text: '5' },
      { id: 'b', text: '50' },
      { id: 'c', text: '15' },
      { id: 'd', text: '105' },
    ],
    correctId: 'c',
    difficulty: 'easy',
  }),
  textEntryItem({
    identifier: 'esp1-u2-q2-write-number',
    title: 'Write the Spanish word for 8',
    beforeText: 'Write the Spanish word for the number 8:',
    correctAnswer: 'ocho',
    difficulty: 'easy',
  }),
  choiceItem({
    identifier: 'esp1-u2-q3-son-las-tres',
    title: 'Telling Time: 3:00',
    prompt: 'How do you say "It is 3:00" in Spanish?',
    choices: [
      { id: 'a', text: 'Es la tres.' },
      { id: 'b', text: 'Son las tres.' },
      { id: 'c', text: 'Son los tres.' },
      { id: 'd', text: 'Es los tres.' },
    ],
    correctId: 'b',
    difficulty: 'medium',
  }),
  inlineChoiceItem({
    identifier: 'esp1-u2-q4-time-1pm',
    title: 'Inline: It is 1:00',
    beforeText: 'Complete: "_______ la una."',
    choices: [
      { id: 'a', text: 'Son' },
      { id: 'b', text: 'Es' },
      { id: 'c', text: 'Está' },
      { id: 'd', text: 'Hay' },
    ],
    correctId: 'b',
    difficulty: 'medium',
  }),
  choiceItem({
    identifier: 'esp1-u2-q5-treinta-dos',
    title: 'Number: treinta y dos',
    prompt: 'What number does "treinta y dos" represent?',
    choices: [
      { id: 'a', text: '23' },
      { id: 'b', text: '320' },
      { id: 'c', text: '302' },
      { id: 'd', text: '32' },
    ],
    correctId: 'd',
    difficulty: 'easy',
  }),
];

const unit2Test = assessmentTest({
  identifier: 'esp1-unit2-numeros-hora',
  title: 'Spanish 1 – Unit 2: Los Números y la Hora',
  parts: [{
    identifier: 'unit2-main-part',
    sections: [{
      identifier: 'unit2-numbers-section',
      title: 'Numbers & Time',
      items: unit2Items.map(i => i.identifier),
    }],
  }],
});

// ═══════════════════════════════════════════════════════════════════════════════
// UNIT 3 – La Familia
// ═══════════════════════════════════════════════════════════════════════════════

const unit3Stimulus = stimulus({
  identifier: 'stimulus-esp1-unit3-familia',
  title: 'La Familia de María',
  language: 'es',
  bodyHtml: `    <div class="stimulus-content">
      <h2>Mi Familia</h2>
      <p>Me llamo María y tengo una familia grande. Mi <strong>padre</strong> se llama Roberto y mi
      <strong>madre</strong> se llama Elena. Tengo un <strong>hermano</strong> mayor, Tomás,
      y una <strong>hermana</strong> menor, Lucía.</p>
      <p>Mis <strong>abuelos</strong> paternos viven en Guadalajara. Mi <strong>abuelo</strong>
      se llama Ernesto y mi <strong>abuela</strong> se llama Rosa. También tengo un
      <strong>tío</strong>, Marcos, y una <strong>tía</strong>, Carmen. Mi <strong>primo</strong>
      Diego y mi <strong>prima</strong> Valeria son los hijos de mis tíos.</p>
      <h3>Vocabulario – La Familia</h3>
      <ul>
        <li>el padre / la madre – father / mother</li>
        <li>el hermano / la hermana – brother / sister</li>
        <li>el abuelo / la abuela – grandfather / grandmother</li>
        <li>los abuelos – grandparents</li>
        <li>el tío / la tía – uncle / aunt</li>
        <li>el primo / la prima – (male) cousin / (female) cousin</li>
        <li>el esposo / la esposa – husband / wife</li>
        <li>el hijo / la hija – son / daughter</li>
      </ul>
    </div>`,
});

const unit3Items = [
  choiceItem({
    identifier: 'esp1-u3-q1-hermano',
    title: 'Vocabulary: hermano',
    prompt: '"Hermano" means…',
    choices: [
      { id: 'a', text: 'Father' },
      { id: 'b', text: 'Cousin' },
      { id: 'c', text: 'Brother' },
      { id: 'd', text: 'Uncle' },
    ],
    correctId: 'c',
    difficulty: 'easy',
  }),
  textEntryItem({
    identifier: 'esp1-u3-q2-grandmother',
    title: 'Translate: grandmother',
    beforeText: 'Translate "grandmother" into Spanish:',
    correctAnswer: 'abuela',
    difficulty: 'easy',
  }),
  choiceItem({
    identifier: 'esp1-u3-q3-esposo',
    title: 'Vocabulary: esposo',
    prompt: 'Which word means "husband" in Spanish?',
    choices: [
      { id: 'a', text: 'hermano' },
      { id: 'b', text: 'primo' },
      { id: 'c', text: 'esposo' },
      { id: 'd', text: 'abuelo' },
    ],
    correctId: 'c',
    difficulty: 'easy',
  }),
  inlineChoiceItem({
    identifier: 'esp1-u3-q4-los-abuelos',
    title: 'Inline: Los abuelos refers to…',
    beforeText: '"Los abuelos" refers to',
    choices: [
      { id: 'a', text: 'the uncles' },
      { id: 'b', text: 'the cousins' },
      { id: 'c', text: 'the grandparents' },
      { id: 'd', text: 'the children' },
    ],
    correctId: 'c',
    afterText: 'in English.',
    difficulty: 'easy',
  }),
  extendedTextItem({
    identifier: 'esp1-u3-q5-mi-familia',
    title: 'Write about your family',
    prompt: 'Describe your family in Spanish using at least 5 family vocabulary words. Write 4–6 sentences. You may use "tengo" (I have), "mi" (my), and "se llama" (his/her name is).',
    difficulty: 'hard',
  }),
];

const unit3Test = assessmentTest({
  identifier: 'esp1-unit3-familia',
  title: 'Spanish 1 – Unit 3: La Familia',
  parts: [{
    identifier: 'unit3-main-part',
    sections: [
      {
        identifier: 'unit3-vocab-section',
        title: 'Family Vocabulary',
        items: ['esp1-u3-q1-hermano', 'esp1-u3-q2-grandmother', 'esp1-u3-q3-esposo', 'esp1-u3-q4-los-abuelos'],
      },
      {
        identifier: 'unit3-writing-section',
        title: 'Writing About Family',
        items: ['esp1-u3-q5-mi-familia'],
      },
    ],
  }],
});

// ═══════════════════════════════════════════════════════════════════════════════
// UNIT 4 – La Comida
// ═══════════════════════════════════════════════════════════════════════════════

const unit4Stimulus = stimulus({
  identifier: 'stimulus-esp1-unit4-comida',
  title: 'En el Restaurante',
  language: 'es',
  bodyHtml: `    <div class="stimulus-content">
      <h2>En el Restaurante "El Buen Sabor"</h2>
      <p><strong>Mesero:</strong> ¡Bienvenidos! ¿Qué desean comer?</p>
      <p><strong>Cliente 1:</strong> Yo quiero el desayuno. ¿Tienen huevos con tocino?</p>
      <p><strong>Mesero:</strong> Sí, señor. También tenemos pan tostado y jugo de naranja.</p>
      <p><strong>Cliente 2:</strong> Para mí, el almuerzo especial: arroz con pollo y ensalada, por favor.</p>
      <p><strong>Mesero:</strong> ¿Y para beber?</p>
      <p><strong>Cliente 2:</strong> Una agua mineral, gracias.</p>
      <hr/>
      <h3>Vocabulario – La Comida</h3>
      <ul>
        <li>el desayuno – breakfast | el almuerzo – lunch | la cena – dinner</li>
        <li>el pan – bread | el pan tostado – toast | los huevos – eggs</li>
        <li>el tocino – bacon | el arroz – rice | el pollo – chicken</li>
        <li>la manzana – apple | la naranja – orange | la ensalada – salad</li>
        <li>el agua – water | el jugo – juice | la leche – milk</li>
        <li>Tengo hambre. – I am hungry. | Tengo sed. – I am thirsty.</li>
        <li>¿Qué desea comer? – What would you like to eat?</li>
        <li>Quiero… / Me gustaría… – I want… / I would like…</li>
      </ul>
    </div>`,
});

const unit4Items = [
  choiceItem({
    identifier: 'esp1-u4-q1-desayuno',
    title: 'Vocabulary: desayuno',
    prompt: 'What does "el desayuno" mean?',
    choices: [
      { id: 'a', text: 'Dinner' },
      { id: 'b', text: 'Snack' },
      { id: 'c', text: 'Breakfast' },
      { id: 'd', text: 'Lunch' },
    ],
    correctId: 'c',
    difficulty: 'easy',
  }),
  textEntryItem({
    identifier: 'esp1-u4-q2-apple',
    title: 'Translate: apple',
    beforeText: 'Write the Spanish word for "apple":',
    correctAnswer: 'manzana',
    difficulty: 'easy',
  }),
  choiceItem({
    identifier: 'esp1-u4-q3-tengo-hambre',
    title: 'Expression: Tengo hambre',
    prompt: '"Tengo hambre" means…',
    choices: [
      { id: 'a', text: 'I am thirsty.' },
      { id: 'b', text: 'I am sleepy.' },
      { id: 'c', text: 'I am full.' },
      { id: 'd', text: 'I am hungry.' },
    ],
    correctId: 'd',
    difficulty: 'easy',
  }),
  inlineChoiceItem({
    identifier: 'esp1-u4-q4-ordering',
    title: 'Inline: Ordering food',
    beforeText: 'To order food politely in a restaurant, you say: "',
    choices: [
      { id: 'a', text: 'Tengo' },
      { id: 'b', text: 'Quiero' },
      { id: 'c', text: 'Soy' },
      { id: 'd', text: 'Estoy' },
    ],
    correctId: 'b',
    afterText: 'el arroz con pollo, por favor."',
    difficulty: 'medium',
  }),
  extendedTextItem({
    identifier: 'esp1-u4-q5-menu-order',
    title: 'Write a restaurant order in Spanish',
    prompt: 'Imagine you are at a Spanish restaurant. Write a 4–6 sentence dialogue ordering a meal. Include what you want to eat, what you want to drink, and at least one food vocabulary word from the reading passage.',
    difficulty: 'hard',
  }),
];

const unit4Test = assessmentTest({
  identifier: 'esp1-unit4-comida',
  title: 'Spanish 1 – Unit 4: La Comida',
  parts: [{
    identifier: 'unit4-main-part',
    sections: [
      {
        identifier: 'unit4-vocab-section',
        title: 'Food Vocabulary & Expressions',
        items: ['esp1-u4-q1-desayuno', 'esp1-u4-q2-apple', 'esp1-u4-q3-tengo-hambre', 'esp1-u4-q4-ordering'],
      },
      {
        identifier: 'unit4-writing-section',
        title: 'Restaurant Dialogue',
        items: ['esp1-u4-q5-menu-order'],
      },
    ],
  }],
});

// ═══════════════════════════════════════════════════════════════════════════════
// UNIT 5 – En la Ciudad
// ═══════════════════════════════════════════════════════════════════════════════

const unit5Stimulus = stimulus({
  identifier: 'stimulus-esp1-unit5-ciudad',
  title: 'Navegando la Ciudad',
  language: 'es',
  bodyHtml: `    <div class="stimulus-content">
      <h2>¿Cómo llegar al museo?</h2>
      <p><strong>Turista:</strong> Perdón, ¿dónde está el museo de arte?</p>
      <p><strong>Habitante:</strong> Está a tres cuadras. Camina derecho por esta calle,
      luego gira a la derecha en la farmacia y el museo está enfrente de la biblioteca.</p>
      <p><strong>Turista:</strong> ¿Hay un banco cerca?</p>
      <p><strong>Habitante:</strong> Sí, el banco está al lado del correo, a una cuadra de aquí.</p>
      <p><strong>Turista:</strong> Muchas gracias.</p>
      <p><strong>Habitante:</strong> ¡De nada!</p>
      <hr/>
      <h3>Vocabulario – En la Ciudad</h3>
      <ul>
        <li>la biblioteca – library | el museo – museum | el banco – bank</li>
        <li>la farmacia – pharmacy | el correo – post office | el hospital – hospital</li>
        <li>la iglesia – church | el mercado – market | el parque – park</li>
        <li>¿Dónde está…? – Where is…?</li>
        <li>Camina derecho. – Walk straight. | Gira a la derecha. – Turn right.</li>
        <li>Gira a la izquierda. – Turn left. | A una cuadra. – One block away.</li>
        <li>al lado de – next to | enfrente de – in front of | cerca de – near</li>
      </ul>
    </div>`,
});

const unit5Items = [
  choiceItem({
    identifier: 'esp1-u5-q1-biblioteca',
    title: 'Vocabulary: biblioteca',
    prompt: '"La biblioteca" is…',
    choices: [
      { id: 'a', text: 'The pharmacy' },
      { id: 'b', text: 'The bookstore' },
      { id: 'c', text: 'The library' },
      { id: 'd', text: 'The museum' },
    ],
    correctId: 'c',
    difficulty: 'easy',
  }),
  textEntryItem({
    identifier: 'esp1-u5-q2-where-is',
    title: 'Ask for directions',
    beforeText: 'How do you ask "Where is the pharmacy?" in Spanish: "¿___________ la farmacia?"',
    correctAnswer: 'Dónde está',
    difficulty: 'medium',
  }),
  choiceItem({
    identifier: 'esp1-u5-q3-girar-izquierda',
    title: 'Directions: turn left',
    prompt: '"Gira a la izquierda" means…',
    choices: [
      { id: 'a', text: 'Go straight' },
      { id: 'b', text: 'Turn right' },
      { id: 'c', text: 'Turn left' },
      { id: 'd', text: 'Stop' },
    ],
    correctId: 'c',
    difficulty: 'easy',
  }),
  inlineChoiceItem({
    identifier: 'esp1-u5-q4-el-correo',
    title: 'Vocabulary: el correo',
    beforeText: '"El correo" refers to the',
    choices: [
      { id: 'a', text: 'bank' },
      { id: 'b', text: 'hospital' },
      { id: 'c', text: 'market' },
      { id: 'd', text: 'post office' },
    ],
    correctId: 'd',
    afterText: 'in English.',
    difficulty: 'easy',
  }),
  extendedTextItem({
    identifier: 'esp1-u5-q5-directions',
    title: 'Write directions in Spanish',
    prompt: 'Using the vocabulary from the reading, write directions from your school to a nearby place (real or imaginary). Use at least 4 direction phrases (e.g., camina derecho, gira a la derecha, está al lado de). Write 4–6 sentences in Spanish.',
    difficulty: 'hard',
  }),
];

const unit5Test = assessmentTest({
  identifier: 'esp1-unit5-ciudad',
  title: 'Spanish 1 – Unit 5: En la Ciudad',
  parts: [{
    identifier: 'unit5-main-part',
    sections: [
      {
        identifier: 'unit5-places-section',
        title: 'City Places & Directions',
        items: ['esp1-u5-q1-biblioteca', 'esp1-u5-q2-where-is', 'esp1-u5-q3-girar-izquierda', 'esp1-u5-q4-el-correo'],
      },
      {
        identifier: 'unit5-writing-section',
        title: 'Give Directions in Spanish',
        items: ['esp1-u5-q5-directions'],
      },
    ],
  }],
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  stimuli: [
    unit1Stimulus,
    unit2Stimulus,
    unit3Stimulus,
    unit4Stimulus,
    unit5Stimulus,
  ],
  assessmentItems: [
    ...unit1Items,
    ...unit2Items,
    ...unit3Items,
    ...unit4Items,
    ...unit5Items,
  ],
  assessmentTests: [
    unit1Test,
    unit2Test,
    unit3Test,
    unit4Test,
    unit5Test,
  ],
};
