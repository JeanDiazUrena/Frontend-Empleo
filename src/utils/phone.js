const NANP_COUNTRY_CODE = '1';
const DOMINICAN_AREA_CODES = new Set(['809', '829', '849']);
const PUERTO_RICO_AREA_CODES = new Set(['787', '939']);

const COUNTRY_RULES = [
  { code: '58', name: 'Venezuela', min: 10, max: 10 },
  { code: '57', name: 'Colombia', min: 10, max: 10 },
  { code: '52', name: 'Mexico', min: 10, max: 10 },
  { code: '506', name: 'Costa Rica', min: 8, max: 8 },
  { code: '507', name: 'Panama', min: 8, max: 8 },
  { code: '503', name: 'El Salvador', min: 8, max: 8 },
  { code: '502', name: 'Guatemala', min: 8, max: 8 },
  { code: '34', name: 'Espana', min: 9, max: 9 },
  { code: '1', name: 'Estados Unidos / Canada', min: 10, max: 10 }
];

const stripPhone = (value = '') => String(value).replace(/[^\d+]/g, '');
const onlyDigits = (value = '') => String(value).replace(/\D/g, '');

const hasFakePattern = (digits) => {
  if (!digits) return true;
  if (/^(\d)\1+$/.test(digits)) return true;
  return '01234567890'.includes(digits) || '09876543210'.includes(digits);
};

const formatGrouped = (digits, groups) => {
  const parts = [];
  let cursor = 0;

  for (const size of groups) {
    const next = digits.slice(cursor, cursor + size);
    if (next) parts.push(next);
    cursor += size;
  }

  const rest = digits.slice(cursor);
  if (rest) parts.push(rest);
  return parts.join('-');
};

const detectNanpCountry = (nationalNumber) => {
  const areaCode = nationalNumber.slice(0, 3);
  if (DOMINICAN_AREA_CODES.has(areaCode)) return 'Republica Dominicana';
  if (PUERTO_RICO_AREA_CODES.has(areaCode)) return 'Puerto Rico';
  return 'Estados Unidos / Canada';
};

const detectCountry = (digits, hasPlus) => {
  if (!digits) return null;

  if (!hasPlus && digits.length <= 10) {
    return {
      code: NANP_COUNTRY_CODE,
      name: detectNanpCountry(digits),
      nationalNumber: digits
    };
  }

  const sortedRules = [...COUNTRY_RULES].sort((a, b) => b.code.length - a.code.length);
  const rule = sortedRules.find((item) => digits.startsWith(item.code));

  if (!rule) return null;

  const nationalNumber = digits.slice(rule.code.length);
  return {
    code: rule.code,
    name: rule.code === NANP_COUNTRY_CODE ? detectNanpCountry(nationalNumber) : rule.name,
    nationalNumber
  };
};

const formatNational = (countryCode, nationalNumber) => {
  if (countryCode === NANP_COUNTRY_CODE) return formatGrouped(nationalNumber.slice(0, 10), [3, 3, 4]);
  if (countryCode === '52' && nationalNumber.length >= 10) return formatGrouped(nationalNumber.slice(0, 10), [2, 4, 4]);
  if (countryCode === '34' && nationalNumber.length >= 9) return formatGrouped(nationalNumber.slice(0, 9), [3, 3, 3]);
  if (nationalNumber.length <= 8) return formatGrouped(nationalNumber, [4, 4]);
  return formatGrouped(nationalNumber.slice(0, 12), [3, 3, 3, 3]);
};

export const formatPhoneInput = (value = '') => {
  const raw = String(value || '').trim();
  const hasPlus = raw.startsWith('+');
  let digits = onlyDigits(raw);

  if (!hasPlus && digits.length > 10 && digits.startsWith(NANP_COUNTRY_CODE)) {
    const nationalNumber = digits.slice(1, 11);
    return `+1 ${formatNational(NANP_COUNTRY_CODE, nationalNumber)}`.trim();
  }

  const detected = detectCountry(digits, hasPlus);
  if (!detected) return hasPlus ? `+${digits}` : formatGrouped(digits.slice(0, 15), [3, 3, 4, 5]);

  const nationalFormatted = formatNational(detected.code, detected.nationalNumber);
  if (hasPlus) return `+${detected.code}${nationalFormatted ? ` ${nationalFormatted}` : ''}`;

  return nationalFormatted || stripPhone(value);
};

export const getPhoneInfo = (value = '') => {
  const raw = String(value || '').trim();
  const hasPlus = raw.startsWith('+');
  const digits = onlyDigits(raw);
  const detected = detectCountry(digits, hasPlus || digits.length > 10);

  if (!digits) {
    return {
      isValid: false,
      formatted: '',
      country: '',
      e164: '',
      message: 'Ingresa un numero de telefono.'
    };
  }

  if (!detected) {
    return {
      isValid: false,
      formatted: formatPhoneInput(raw),
      country: 'Pais no reconocido',
      e164: '',
      message: 'Incluye un codigo de pais valido o un numero local real.'
    };
  }

  const nationalNumber = detected.nationalNumber;
  const e164 = `+${detected.code}${nationalNumber}`;
  const formattedNational = formatNational(detected.code, nationalNumber);
  const formatted = hasPlus || digits.length > 10
    ? `+${detected.code} ${formattedNational}`.trim()
    : formattedNational;

  let isValid = true;
  let message = '';

  if (hasFakePattern(nationalNumber)) {
    isValid = false;
    message = 'Ese numero no parece real. Usa un telefono valido.';
  } else if (detected.code === NANP_COUNTRY_CODE) {
    const areaCode = nationalNumber.slice(0, 3);
    const exchange = nationalNumber.slice(3, 6);
    const isDominican = DOMINICAN_AREA_CODES.has(areaCode);
    const isPuertoRico = PUERTO_RICO_AREA_CODES.has(areaCode);

    if (nationalNumber.length !== 10) {
      isValid = false;
      message = 'El telefono debe tener 10 digitos.';
    } else if (!/^[2-9]\d{2}$/.test(areaCode) || !/^[2-9]\d{2}$/.test(exchange)) {
      isValid = false;
      message = 'El codigo de area o central no es valido.';
    } else if (!hasPlus && !isDominican && !isPuertoRico) {
      isValid = false;
      message = 'Para numeros fuera de Republica Dominicana usa el codigo de pais, por ejemplo +1.';
    }
  } else {
    const rule = COUNTRY_RULES.find((item) => item.code === detected.code);
    if (rule && (nationalNumber.length < rule.min || nationalNumber.length > rule.max)) {
      isValid = false;
      message = `El telefono de ${rule.name} debe tener ${rule.min === rule.max ? rule.min : `${rule.min}-${rule.max}`} digitos.`;
    }
  }

  return {
    isValid,
    formatted,
    country: detected.name,
    e164,
    message: message || `Telefono detectado: ${detected.name}.`
  };
};
