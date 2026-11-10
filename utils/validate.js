function cleanPatient(b = {}) {
  const s = (v) => String(v ?? '').trim();
  const data = {
    first_name: s(b.first_name),
    middle_name: s(b.middle_name),
    last_name: s(b.last_name),
    contact_number: s(b.contact_number),
    age: s(b.age) === '' ? NaN : Number(b.age),
    gender: s(b.gender)
  };
  if (!data.first_name || !data.last_name) return { error: 'First name and last name are required.' };
  if (!/^[0-9+\-\s]{7,15}$/.test(data.contact_number)) return { error: 'Enter a valid contact number.' };
  if (!Number.isInteger(data.age) || data.age < 0 || data.age > 120) return { error: 'Enter a valid age (0–120).' };
  if (!['Male', 'Female', 'Other'].includes(data.gender)) return { error: 'Please select a gender.' };
  return { data };
}

const validDateTime = (v) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v) && !isNaN(new Date(v));

module.exports = { cleanPatient, validDateTime };