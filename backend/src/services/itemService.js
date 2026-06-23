import { categories, items, marketItems } from '../data/items.js';
import { recipeByItemId } from '../data/recipes.js';

export const findItems = ({ category, tier, search, scope } = {}) => {
  const source = scope === 'market'
    ? marketItems
    : items;
  const normalizedSearch = String(search || '').trim().toLowerCase();
  return source.filter((item) => {
    if (category && item.category !== category) return false;
    if (tier && item.tier !== Number(tier)) return false;
    if (normalizedSearch && !`${item.name} ${item.itemId}`.toLowerCase().includes(normalizedSearch)) {
      return false;
    }
    if (scope === 'crafting' && !recipeByItemId.has(item.itemId)) return false;
    return true;
  });
};

export const getItemCatalog = (filters) => ({
  items: findItems(filters),
  categories,
  tiers: [...new Set(findItems(filters).map((item) => item.tier))].sort((first, second) => first - second),
});
