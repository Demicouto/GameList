export type RegistrationFields = {
  name: string;
  username: string;
  email: string;
  password: string;
  confirm: string;
  accepted: boolean;
};

// Count Unicode code points and UTF-8 bytes without Node's Buffer on native.
export function passwordBytes(password: string): number {
  return Array.from(password).reduce((bytes, character) => {
    const point = character.codePointAt(0)!;
    return bytes + (point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4);
  }, 0);
}

export function passwordError(password: string): string | null {
  if (Array.from(password).length < 8) return 'A senha deve ter pelo menos 8 caracteres.';
  if (passwordBytes(password) > 72) return 'A senha deve ter no máximo 72 bytes UTF-8.';
  return null;
}

export function validateRegistration(input: RegistrationFields): Partial<Record<keyof RegistrationFields, string>> {
  const errors: Partial<Record<keyof RegistrationFields, string>> = {};
  const nameLength = Array.from(input.name.trim()).length;
  if (!nameLength || nameLength > 100) errors.name = 'O nome deve ter entre 1 e 100 caracteres.';
  if (!/^[a-z0-9_]{3,30}$/.test(input.username.trim().toLowerCase())) {
    errors.username = 'Use de 3 a 30 caracteres: letras, números ou _.';
  }
  const email = input.email.trim();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Informe um e-mail válido.';
  const error = passwordError(input.password);
  if (error) errors.password = error;
  if (input.password !== input.confirm) errors.confirm = 'As senhas não coincidem.';
  if (!input.accepted) errors.accepted = 'Confirme que concorda com os termos para continuar.';
  return errors;
}
