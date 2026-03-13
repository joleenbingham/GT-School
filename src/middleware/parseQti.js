const xml2js = require('xml2js');

const xmlParser = new xml2js.Parser({
  explicitArray: false,
  explicitCharkey: false,
  attrkey: '_attributes',
  charkey: '_text',
  mergeAttrs: false,
});

/**
 * Parse raw XML string into a JS object using xml2js.
 * @param {string} xmlString
 * @returns {Promise<object>}
 */
async function parseXml(xmlString) {
  return new Promise((resolve, reject) => {
    xmlParser.parseString(xmlString, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

/**
 * Build a minimal QTI 3.0 stimulus XML from JSON payload.
 */
function buildStimulusXml({ identifier, title, language = 'en', content, toolName, toolVersion }) {
  const tool = toolName ? ` tool-name="${toolName}"` : '';
  const toolVer = toolVersion ? ` tool-version="${toolVersion}"` : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-stimulus
  xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asistv3p0_v1p0.xsd"
  identifier="${identifier}"
  title="${title}"
  xml:lang="${language}"${tool}${toolVer}>
  <qti-stimulus-body>
    ${content || ''}
  </qti-stimulus-body>
</qti-assessment-stimulus>`;
}

/**
 * Build a minimal QTI 3.0 assessment item XML from JSON payload.
 */
function buildAssessmentItemXml({
  identifier,
  title,
  language = 'en',
  timeDependent = false,
  adaptive = false,
  toolName,
  toolVersion,
}) {
  const tool = toolName ? ` tool-name="${toolName}"` : '';
  const toolVer = toolVersion ? ` tool-version="${toolVersion}"` : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item
  xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asistv3p0_v1p0.xsd"
  identifier="${identifier}"
  title="${title}"
  xml:lang="${language}"
  time-dependent="${timeDependent}"
  adaptive="${adaptive}"${tool}${toolVer}>
  <qti-item-body>
  </qti-item-body>
</qti-assessment-item>`;
}

module.exports = { parseXml, buildStimulusXml, buildAssessmentItemXml };
