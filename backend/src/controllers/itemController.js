import { getItemCatalog } from '../services/itemService.js';

export const getItems = (request, response) => {
  const catalog = getItemCatalog({
    category: request.query.category,
    tier: request.query.tier,
    search: request.query.search,
    scope: request.query.scope,
  });
  response.json({ data: catalog.items, meta: { categories: catalog.categories, tiers: catalog.tiers } });
};
