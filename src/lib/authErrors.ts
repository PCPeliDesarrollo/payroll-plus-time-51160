/**
 * Traduce los mensajes de error de autenticación (en inglés) a español,
 * con redacción clara para el usuario final.
 */
export function translateAuthError(message: string): string {
  const msg = (message || '').toLowerCase();

  if (msg.includes('weak_password') || msg.includes('known to be weak') || msg.includes('easy to guess') || msg.includes('pwned')) {
    return 'La contraseña es demasiado débil: es muy común o ha aparecido en filtraciones conocidas. Elige una de al menos 8 caracteres combinando mayúsculas, minúsculas, números y símbolos (ej. Peli#2026x).';
  }
  if (msg.includes('password should be at least') || msg.includes('password must be at least') || msg.includes('at least 6 characters')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (msg.includes('user already registered') || msg.includes('already been registered') || msg.includes('email address provided is already')) {
    return 'Este email ya está registrado. Usa otro email diferente.';
  }
  if (msg.includes('duplicate key value') && msg.includes('employee_id')) {
    return 'El ID de empleado ya existe. Usa un ID diferente.';
  }
  if (msg.includes('duplicate key value')) {
    return 'Ya existe un registro con esos datos. Revisa el email y el ID de empleado.';
  }
  if (msg.includes('unable to validate email address') || msg.includes('invalid format')) {
    return 'El formato del email no es válido.';
  }
  if (msg.includes('email not confirmed')) {
    return 'El email no ha sido confirmado. Contacta con el administrador.';
  }
  if (msg.includes('invalid login credentials')) {
    return 'Credenciales incorrectas. Verifica tu email y contraseña.';
  }
  if (msg.includes('not authenticated') || msg.includes('jwt')) {
    return 'Tu sesión ha expirado. Vuelve a iniciar sesión.';
  }
  if (msg.includes('not authorized') || msg.includes('permission')) {
    return 'No tienes permisos para realizar esta acción.';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Has realizado demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
  }
  if (msg.includes('same password')) {
    return 'La nueva contraseña no puede ser igual a la anterior.';
  }

  return message;
}
