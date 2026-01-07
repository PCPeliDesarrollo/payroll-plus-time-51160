// Festivos nacionales de España y regionales de Extremadura (2025-2030)

interface Holiday {
  date: string; // YYYY-MM-DD format
  name: string;
  type: 'national' | 'regional'; // nacional o regional (Extremadura)
}

// Función para calcular Domingo de Pascua (algoritmo de Butcher)
function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Genera festivos fijos y móviles para un año
function generateHolidaysForYear(year: number): Holiday[] {
  const holidays: Holiday[] = [];
  
  // === FESTIVOS NACIONALES FIJOS ===
  holidays.push({ date: `${year}-01-01`, name: 'Año Nuevo', type: 'national' });
  holidays.push({ date: `${year}-01-06`, name: 'Día de Reyes', type: 'national' });
  holidays.push({ date: `${year}-05-01`, name: 'Día del Trabajo', type: 'national' });
  holidays.push({ date: `${year}-08-15`, name: 'Asunción de la Virgen', type: 'national' });
  holidays.push({ date: `${year}-10-12`, name: 'Fiesta Nacional de España', type: 'national' });
  holidays.push({ date: `${year}-11-01`, name: 'Día de Todos los Santos', type: 'national' });
  holidays.push({ date: `${year}-12-06`, name: 'Día de la Constitución', type: 'national' });
  holidays.push({ date: `${year}-12-08`, name: 'Inmaculada Concepción', type: 'national' });
  holidays.push({ date: `${year}-12-25`, name: 'Navidad', type: 'national' });
  
  // === FESTIVOS MÓVILES (Semana Santa) ===
  const easter = getEasterDate(year);
  const holyThursday = addDays(easter, -3);
  const goodFriday = addDays(easter, -2);
  
  holidays.push({ date: formatDate(holyThursday), name: 'Jueves Santo', type: 'national' });
  holidays.push({ date: formatDate(goodFriday), name: 'Viernes Santo', type: 'national' });
  
  // === FESTIVOS REGIONALES DE EXTREMADURA ===
  // Día de Extremadura (fijo)
  holidays.push({ date: `${year}-09-08`, name: 'Día de Extremadura', type: 'regional' });
  
  // Carnaval - Martes de Carnaval (47 días antes de Pascua)
  const carnival = addDays(easter, -47);
  holidays.push({ date: formatDate(carnival), name: 'Martes de Carnaval', type: 'regional' });
  
  // Lunes de Pascua (día después de Pascua - algunas localidades)
  const easterMonday = addDays(easter, 1);
  holidays.push({ date: formatDate(easterMonday), name: 'Lunes de Pascua', type: 'regional' });
  
  // === FESTIVOS LOCALES DE ALBURQUERQUE ===
  holidays.push({ date: `${year}-05-22`, name: 'Fiesta Local Alburquerque', type: 'regional' });
  holidays.push({ date: `${year}-09-09`, name: 'Fiesta Local Alburquerque', type: 'regional' });
  
  return holidays;
}

// Cache de festivos por año
const holidaysCache: Record<number, Holiday[]> = {};

export function getHolidaysForYear(year: number): Holiday[] {
  if (!holidaysCache[year]) {
    holidaysCache[year] = generateHolidaysForYear(year);
  }
  return holidaysCache[year];
}

export function getHolidaysForMonth(year: number, month: number): Holiday[] {
  const holidays = getHolidaysForYear(year);
  const monthStr = String(month + 1).padStart(2, '0');
  return holidays.filter(h => h.date.startsWith(`${year}-${monthStr}`));
}

export function isHoliday(dateStr: string): Holiday | undefined {
  const year = parseInt(dateStr.substring(0, 4));
  const holidays = getHolidaysForYear(year);
  return holidays.find(h => h.date === dateStr);
}

export function getHolidayName(dateStr: string): string | undefined {
  const holiday = isHoliday(dateStr);
  return holiday?.name;
}

export function isNationalHoliday(dateStr: string): boolean {
  const holiday = isHoliday(dateStr);
  return holiday?.type === 'national';
}

export function isRegionalHoliday(dateStr: string): boolean {
  const holiday = isHoliday(dateStr);
  return holiday?.type === 'regional';
}

export type { Holiday };
