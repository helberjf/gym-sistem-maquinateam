export function onlyDigits(value?: string | null) {
  return value?.replace(/\D/g, "") ?? "";
}

export function normalizeBrazilPhoneDigits(value?: string | null) {
  let digits = onlyDigits(value);

  if (digits.startsWith("55") && digits.length > 11) {
    digits = digits.slice(2);
  }

  return digits.slice(0, 11);
}

export function formatCpf(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  const part1 = digits.slice(0, 3);
  const part2 = digits.slice(3, 6);
  const part3 = digits.slice(6, 9);
  const part4 = digits.slice(9, 11);

  if (digits.length <= 3) {
    return part1;
  }

  if (digits.length <= 6) {
    return `${part1}.${part2}`;
  }

  if (digits.length <= 9) {
    return `${part1}.${part2}.${part3}`;
  }

  return `${part1}.${part2}.${part3}-${part4}`;
}

export function formatPhoneBR(value: string) {
  const digits = normalizeBrazilPhoneDigits(value);
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);

  if (!digits) {
    return "";
  }

  if (digits.length <= 2) {
    return `(${ddd}`;
  }

  if (rest.length <= 4) {
    return `(${ddd}) ${rest}`.trim();
  }

  if (rest.length <= 8) {
    return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`.trim();
  }

  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`.trim();
}

export function formatZipCodeBR(value: string) {
  const digits = onlyDigits(value).slice(0, 8);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function formatStateUf(value: string) {
  return value.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase();
}
