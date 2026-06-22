export const formatSilver = (value, compact = false) => {
  const numeric = Number(value || 0);
  if (compact && Math.abs(numeric) >= 1000) {
    return new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(numeric);
  }
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(numeric);
};

export const formatPercent = (value) => `${Number(value || 0).toFixed(1).replace('.', ',')}%`;

export const formatDate = (value) => {
  if (!value) return 'Sem registro';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));
};

export const qualityName = (quality) => ({
  1: 'Normal', 2: 'Bom', 3: 'Excepcional', 4: 'Excelente', 5: 'Obra-prima',
}[quality] || `Q${quality}`);
