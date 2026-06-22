import { categories, items } from '../data/items.js';

export const findItems = ({ category, tier, search } = {}) => {
  const normalizedSearch = String(search || '').trim().toLowerCase();
  return items.filter((item) => {
    if (category && item.category !== category) return false;
    if (tier && item.tier !== Number(tier)) return false;
    if (normalizedSearch && !`${item.name} ${item.itemId}`.toLowerCase().includes(normalizedSearch)) {
      return false;
    }
    return true;
  });
};

export const getItemCatalog = (filters) => ({
  items: findItems(filters),
  categories,
  tiers: [4, 5, 6, 7, 8],
});
