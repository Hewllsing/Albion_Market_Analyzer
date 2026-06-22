export const parseCsv = (value, fallback = []) => {
  if (!value) return fallback;
  const source = Array.isArray(value) ? value : String(value).split(',');
  return [...new Set(source.map((entry) => String(entry).trim()).filter(Boolean))];
};

export const parseNumber = (value, fallback, { min = -Infinity, max = Infinity } = {}) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

export const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['true', '1', 'yes', 'sim'].includes(String(value).toLowerCase());
};
