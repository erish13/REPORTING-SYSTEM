// Test the date formatting logic
function isValidDate(d) {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (!isValidDate(d)) return String(value);
  return d.toLocaleDateString('en-PH');
}

function formatDateRange(startDate, endDate) {
  const start = formatDate(startDate) || '-';
  const end = formatDate(endDate) || '-';
  return `${start} to ${end}`;
}

// Test cases
const testCases = [
  { from: '2026-02-18', to: '2026-03-15', desc: 'Both dates valid' },
  { from: '2026-02-18', to: null, desc: 'End date null' },
  { from: null, to: '2026-03-15', desc: 'Start date null' },
  { from: null, to: null, desc: 'Both dates null' },
  { from: '2026-02-18', to: undefined, desc: 'End date undefined' },
  { from: undefined, to: '2026-03-15', desc: 'Start date undefined' },
];

console.log('Testing date formatting:\n');
testCases.forEach(test => {
  const result = formatDateRange(test.from, test.to);
  console.log(`${test.desc}:`);
  console.log(`  From: ${test.from}, To: ${test.to}`);
  console.log(`  Result: "${result}"`);
  console.log();
});
