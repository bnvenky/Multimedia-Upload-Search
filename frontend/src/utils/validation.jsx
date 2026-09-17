/** Same password rules as the API (backend/src/schemas/auth.schema.js), shown live while typing. */
export const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (value) => value.length >= 8 },
  { label: 'An uppercase letter', test: (value) => /[A-Z]/.test(value) },
  { label: 'A lowercase letter', test: (value) => /[a-z]/.test(value) },
  { label: 'A number', test: (value) => /\d/.test(value) },
];

export const isPasswordValid = (value) => PASSWORD_RULES.every((rule) => rule.test(value));
