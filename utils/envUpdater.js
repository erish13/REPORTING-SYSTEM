const fs = require('fs');
const path = require('path');

function updateEnvVariable(key, value) {
  const envPath = path.join(process.cwd(), '.env');
  const entry = `${key}=${value}`;

  const existing = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
    : [];

  let updated = false;
  const transformed = existing.map((line) => {
    if (line.trim().startsWith(`${key}=`)) {
      updated = true;
      return entry;
    }
    return line;
  });

  if (!updated) {
    transformed.push(entry);
  }

  const filtered = transformed.filter((line) => line !== undefined);
  fs.writeFileSync(envPath, `${filtered.join('\n')}\n`, 'utf8');
}

module.exports = { updateEnvVariable };
