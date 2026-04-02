import { onlyDigits } from "@/lib/utils/formatters";

export function validateCpf(cpf: string) {
  const cleanCpf = onlyDigits(cpf);

  if (cleanCpf.length !== 11) {
    return false;
  }

  if (/^(\d)\1{10}$/.test(cleanCpf)) {
    return false;
  }

  const digits = cleanCpf.split("").map(Number);

  let sum = 0;

  for (let index = 0; index < 9; index += 1) {
    sum += digits[index] * (10 - index);
  }

  let firstCheck = (sum * 10) % 11;

  if (firstCheck === 10) {
    firstCheck = 0;
  }

  if (firstCheck !== digits[9]) {
    return false;
  }

  sum = 0;

  for (let index = 0; index < 10; index += 1) {
    sum += digits[index] * (11 - index);
  }

  let secondCheck = (sum * 10) % 11;

  if (secondCheck === 10) {
    secondCheck = 0;
  }

  return secondCheck === digits[10];
}
