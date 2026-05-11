const DIGIT_GROUPS = {
  visa: [4, 4, 4, 4, 3],
  mastercard: [4, 4, 4, 4],
  amex: [4, 6, 5],
  card: [4, 4, 4, 4]
};

const BRAND_DATA = {
  visa: {
    key: 'visa',
    label: 'Visa',
    icon: 'fa-brands fa-cc-visa',
    cvcLength: 3,
    lengths: [13, 16, 19]
  },
  mastercard: {
    key: 'mastercard',
    label: 'MasterCard',
    icon: 'fa-brands fa-cc-mastercard',
    cvcLength: 3,
    lengths: [16]
  },
  amex: {
    key: 'amex',
    label: 'American Express',
    icon: 'fa-brands fa-cc-amex',
    cvcLength: 4,
    lengths: [15]
  },
  card: {
    key: 'card',
    label: 'Tarjeta',
    icon: 'fa-solid fa-credit-card',
    cvcLength: 3,
    lengths: [13, 14, 15, 16, 19]
  }
};

export const onlyDigits = (value = '') => String(value).replace(/\D/g, '');

export const normalizeCardBrand = (brand = '') => {
  const value = String(brand).toLowerCase().replace(/[\s_-]/g, '');
  if (value.includes('american') || value.includes('amex')) return 'amex';
  if (value.includes('master')) return 'mastercard';
  if (value.includes('visa')) return 'visa';
  return 'card';
};

export const getBrandData = (brand = 'card') => BRAND_DATA[normalizeCardBrand(brand)] || BRAND_DATA.card;

export const detectCardBrand = (value = '') => {
  const digits = onlyDigits(value);
  if (/^4/.test(digits)) return BRAND_DATA.visa;
  if (/^3[47]/.test(digits)) return BRAND_DATA.amex;

  const firstTwo = Number(digits.slice(0, 2));
  const firstFour = Number(digits.slice(0, 4));
  if ((firstTwo >= 51 && firstTwo <= 55) || (firstFour >= 2221 && firstFour <= 2720)) {
    return BRAND_DATA.mastercard;
  }

  return BRAND_DATA.card;
};

export const formatCardNumber = (value = '') => {
  const digits = onlyDigits(value).slice(0, 19);
  const brand = detectCardBrand(digits);
  const groups = DIGIT_GROUPS[brand.key] || DIGIT_GROUPS.card;
  const parts = [];
  let index = 0;

  for (const groupSize of groups) {
    if (index >= digits.length) break;
    parts.push(digits.slice(index, index + groupSize));
    index += groupSize;
  }

  return parts.join(' ');
};

export const formatExpiryInput = (value = '') => {
  const digits = onlyDigits(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

export const formatCvcInput = (value = '', brand = 'card') => {
  const max = getBrandData(brand).cvcLength;
  return onlyDigits(value).slice(0, max);
};

export const normalizeExpiry = (value = '') => {
  const formatted = formatExpiryInput(value);
  return formatted.length === 5 ? formatted : value;
};

export const maskCardLast4 = (last4 = '') => `•••• •••• •••• ${String(last4 || '').slice(-4)}`;

const hasRepeatedDigitsOnly = (digits) => /^(\d)\1+$/.test(digits);

const isAscendingOrDescending = (digits) => {
  if (digits.length < 8) return false;
  const sequence = '01234567890123456789';
  const reverse = '98765432109876543210';
  return sequence.includes(digits) || reverse.includes(digits);
};

export const passesLuhn = (value = '') => {
  const digits = onlyDigits(value);
  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return digits.length > 0 && sum % 10 === 0;
};

export const validateHolderName = (value = '') => {
  const normalized = String(value).trim().replace(/\s+/g, ' ');
  const parts = normalized.split(' ').filter(Boolean);
  const lettersOnly = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]+$/.test(normalized);
  return normalized.length >= 5 && parts.length >= 2 && lettersOnly;
};

export const validateExpiry = (value = '') => {
  const match = String(value).trim().match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
  if (!match) return false;

  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  const lastDayOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
  return lastDayOfMonth >= new Date();
};

export const validateCardNumber = (value = '') => {
  const digits = onlyDigits(value);
  const brand = detectCardBrand(digits);
  return (
    brand.key !== 'card' &&
    brand.lengths.includes(digits.length) &&
    !hasRepeatedDigitsOnly(digits) &&
    !isAscendingOrDescending(digits) &&
    passesLuhn(digits)
  );
};

export const validateCvc = (value = '', brand = 'card') => {
  const cvc = onlyDigits(value);
  return cvc.length === getBrandData(brand).cvcLength;
};

export const getCardValidation = (card = {}) => {
  const number = card.number ?? card.card_number ?? '';
  const holderName = card.holderName ?? card.holder_name ?? card.name ?? '';
  const exp = card.exp ?? card.expiry ?? '';
  const cvc = card.cvc ?? card.cvv ?? '';
  const brand = detectCardBrand(number);
  const errors = {};

  if (!validateHolderName(holderName)) errors.holderName = 'Escribe nombre y apellido del titular.';
  if (!validateCardNumber(number)) errors.number = 'Ingresa un número válido de Visa, MasterCard o American Express.';
  if (!validateExpiry(exp)) errors.exp = 'La fecha debe ser válida y no estar vencida.';
  if (!validateCvc(cvc, brand.key)) errors.cvc = `El CVV debe tener ${brand.cvcLength} dígitos.`;

  return {
    brand,
    errors,
    isValid: Object.keys(errors).length === 0,
    sanitized: {
      holderName: String(holderName).trim().replace(/\s+/g, ' '),
      number: onlyDigits(number),
      exp: normalizeExpiry(exp),
      cvc: onlyDigits(cvc)
    }
  };
};

export const getFirstCardError = (card = {}) => {
  const { errors } = getCardValidation(card);
  return errors.holderName || errors.number || errors.exp || errors.cvc || '';
};

export const formatBankAccount = (value = '') => {
  const digits = onlyDigits(value).slice(0, 20);
  return (digits.match(/.{1,4}/g) || []).join(' ');
};

export const validateBankAccount = ({ holderName = '', bankName = '', accountNumber = '' } = {}) => {
  const digits = onlyDigits(accountNumber);
  const errors = {};

  if (!validateHolderName(holderName)) errors.holderName = 'Escribe nombre y apellido del titular.';
  if (!String(bankName).trim()) errors.bankName = 'Selecciona un banco.';
  if (
    digits.length < 8 ||
    digits.length > 20 ||
    hasRepeatedDigitsOnly(digits) ||
    isAscendingOrDescending(digits)
  ) {
    errors.accountNumber = 'Ingresa un número de cuenta válido.';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    sanitized: {
      holderName: String(holderName).trim().replace(/\s+/g, ' '),
      bankName: String(bankName).trim(),
      accountNumber: digits
    }
  };
};
