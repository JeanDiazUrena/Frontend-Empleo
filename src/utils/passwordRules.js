export const passwordRequirements = [
  {
    id: 'length',
    label: 'Mínimo 8 caracteres',
    missing: 'Falta llegar a 8 caracteres.',
    test: (value) => String(value || '').length >= 8
  },
  {
    id: 'uppercase',
    label: 'Al menos 1 mayúscula',
    missing: 'Falta una mayúscula.',
    test: (value) => /[A-Z]/.test(String(value || ''))
  },
  {
    id: 'lowercase',
    label: 'Al menos 1 minúscula',
    missing: 'Falta una minúscula.',
    test: (value) => /[a-z]/.test(String(value || ''))
  },
  {
    id: 'number',
    label: 'Al menos 1 número',
    missing: 'Falta un número.',
    test: (value) => /[0-9]/.test(String(value || ''))
  },
  {
    id: 'symbol',
    label: 'Al menos 1 símbolo',
    missing: 'Falta un símbolo.',
    test: (value) => /[^A-Za-z0-9]/.test(String(value || ''))
  }
];

export function getPasswordStatus(password) {
  const checks = passwordRequirements.map((requirement) => ({
    ...requirement,
    met: requirement.test(password)
  }));
  const missing = checks.find((requirement) => !requirement.met);

  return {
    checks,
    score: checks.filter((requirement) => requirement.met).length,
    isValid: !missing,
    missingMessage: missing?.missing || ''
  };
}
