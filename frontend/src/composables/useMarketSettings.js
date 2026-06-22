import { reactive } from 'vue';

const saved = JSON.parse(localStorage.getItem('ama:settings') || '{}');
const settings = reactive({
  server: saved.server || 'europe',
  marketTaxPercent: saved.marketTaxPercent ?? 6.5,
});

export const cities = ['Bridgewatch', 'Caerleon', 'Fort Sterling', 'Lymhurst', 'Martlock', 'Thetford'];
export const servers = [
  { value: 'europe', label: 'Europa' },
  { value: 'americas', label: 'Americas' },
  { value: 'asia', label: 'Asia' },
];

export const useMarketSettings = () => {
  const saveSettings = () => localStorage.setItem('ama:settings', JSON.stringify(settings));
  return { settings, cities, servers, saveSettings };
};
