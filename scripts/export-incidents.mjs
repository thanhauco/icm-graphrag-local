import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const workspaceRoot = process.cwd();
const appPath = path.join(workspaceRoot, 'src', 'App.jsx');
const outDir = path.join(workspaceRoot, 'exports');
const outPath = path.join(outDir, 'incidents.csv');

const source = fs.readFileSync(appPath, 'utf8');
const startMarker = 'const SERVICES = [';
const endMarker = 'const INCIDENTS = generateIncidents();';

const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker);

if (start === -1 || end === -1 || end <= start) {
  throw new Error('Could not locate incident generator block in src/App.jsx');
}

const generatorBlock = source.slice(start, end);
const executable = `${generatorBlock}\nconst INCIDENTS = generateIncidents();\nmodule.exports = { INCIDENTS };`;

const sandbox = {
  module: { exports: {} },
  exports: {},
  Date,
  Math,
};

vm.runInNewContext(executable, sandbox, { timeout: 10000, filename: 'incident-generator.vm.js' });

const incidents = sandbox.module.exports.INCIDENTS;
if (!Array.isArray(incidents)) {
  throw new Error('Failed to generate incidents array');
}

const headers = [
  'id',
  'title',
  'severity',
  'status',
  'createdAt',
  'resolvedAt',
  'mttr',
  'affectedServices',
  'rootComponent',
  'triggeredBy',
  'resolvedBy',
  'errorCode',
  'customerImpact',
  'summary',
  'team',
  'similarIncidents',
  'region',
];

function csvEscape(value) {
  const str = value == null ? '' : String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function normalizeField(value) {
  if (Array.isArray(value)) {
    return value.join('|');
  }
  return value;
}

const lines = [headers.join(',')];
for (const inc of incidents) {
  const row = headers.map((h) => csvEscape(normalizeField(inc[h])));
  lines.push(row.join(','));
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, lines.join('\n'), 'utf8');

console.log(`Exported ${incidents.length} incidents to ${outPath}`);
