import { writeFile } from 'node:fs/promises';

const ITEMS_JSON_URL = 'https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/items.json';
const ITEMS_TXT_URL = 'https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/formatted/items.txt';
const OUTPUT_PATH = new URL('../backend/src/data/generatedCraftingData.js', import.meta.url);

const toArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const inferTier = (itemId) => Number(itemId.match(/^T(\d+)/)?.[1] || 0);

const inferEnchantment = (itemId) => Number(itemId.match(/@(\d+)$/)?.[1] || 0);

const parseNames = (text) => new Map(text
  .split(/\r?\n/)
  .map((line) => line.match(/^\s*\d+:\s*(\S+)\s*:\s*(.+)$/))
  .filter(Boolean)
  .map((match) => [match[1], match[2].trim()]));

const outputGroup = (item) => {
  if (item['@shopcategory'] === 'consumables' && item['@shopsubcategory1'] === 'food') return 'food';
  if (item['@shopcategory'] === 'consumables' && item['@shopsubcategory1'] === 'potions') return 'potions';
  if (['weapons', 'armor'].includes(item['@shopcategory'])) return 'equipment';
  return null;
};

const outputCategory = (item, group) => {
  if (group === 'food') return 'Comidas';
  if (group === 'potions') return 'Pocoes';
  return item['@shopcategory'] === 'weapons' ? 'Armas' : 'Armaduras';
};

const materialCategory = (itemId) => {
  if (/_(ORE|WOOD|FIBER|HIDE|ROCK)(@|$)/.test(itemId)) return 'Recursos brutos';
  if (/_(METALBAR|PLANKS|CLOTH|LEATHER|STONEBLOCK)(@|$)/.test(itemId)) return 'Recursos refinados';
  if (/FISH|MEAT|MILK|EGG|BREAD|ALCOHOL|ALCHEMY|SAUCE|CARROT|BEAN|WHEAT|TURNIP|CABBAGE|POTATO|CORN|PUMPKIN|AGARIC|COMFREY|BURDOCK|TEASEL|FOXGLOVE|MULLEIN|YARROW|SEAWEED/.test(itemId)) {
    return 'Ingredientes';
  }
  return 'Materiais de Craft';
};

const materialList = (requirements) => {
  const amountCrafted = Number(requirements?.['@amountcrafted'] || 1) || 1;
  return toArray(requirements?.craftresource)
    .map((resource) => ({
      itemId: resource['@uniquename'],
      quantity: Number(resource['@count'] || 0) / amountCrafted,
    }))
    .filter((resource) => resource.itemId && resource.quantity > 0);
};

const roundQuantity = (value) => Number(value.toFixed(6));

const makeItem = ({ itemId, name, category, tier, enchantment }) => ({
  itemId,
  name,
  category,
  tier,
  enchantment,
});

const makeRecipe = ({ group, itemId, materials }) => ({
  group,
  itemId,
  materials: materials.map((resource) => ({
    itemId: resource.itemId,
    quantity: roundQuantity(resource.quantity),
  })),
});

const stableSortItems = (first, second) =>
  first.category.localeCompare(second.category) ||
  first.tier - second.tier ||
  first.itemId.localeCompare(second.itemId);

const stableSortRecipes = (first, second) =>
  first.group.localeCompare(second.group) ||
  first.itemId.localeCompare(second.itemId);

const [itemsJson, namesText] = await Promise.all([
  fetch(ITEMS_JSON_URL).then((response) => response.json()),
  fetch(ITEMS_TXT_URL).then((response) => response.text()),
]);

const names = parseNames(namesText);
const outputItems = [];
const materialItems = new Map();
const recipes = [];
const roots = ['consumableitem', 'equipmentitem', 'weapon']
  .flatMap((key) => toArray(itemsJson.items[key]));

const addMaterial = (itemId) => {
  if (materialItems.has(itemId)) return;
  materialItems.set(itemId, makeItem({
    itemId,
    name: names.get(itemId) || itemId,
    category: materialCategory(itemId),
    tier: inferTier(itemId),
    enchantment: inferEnchantment(itemId),
  }));
};

const addRecipe = ({ item, itemId, group, enchantment = 0, requirements }) => {
  const materials = materialList(requirements);
  if (!materials.length) return;
  outputItems.push(makeItem({
    itemId,
    name: names.get(itemId) || `${names.get(item['@uniquename']) || itemId}${enchantment ? ` .${enchantment}` : ''}`,
    category: outputCategory(item, group),
    tier: Number(item['@tier'] || inferTier(itemId)),
    enchantment,
  }));
  materials.forEach((resource) => addMaterial(resource.itemId));
  recipes.push(makeRecipe({ group, itemId, materials }));
};

for (const item of roots) {
  const group = outputGroup(item);
  if (!group) continue;

  if (item.craftingrequirements) {
    addRecipe({
      item,
      itemId: item['@uniquename'],
      group,
      requirements: item.craftingrequirements,
    });
  }

  for (const enchantment of toArray(item.enchantments?.enchantment)) {
    if (!enchantment.craftingrequirements) continue;
    const enchantmentLevel = Number(enchantment['@enchantmentlevel'] || 0);
    addRecipe({
      item,
      itemId: `${item['@uniquename']}@${enchantmentLevel}`,
      group,
      enchantment: enchantmentLevel,
      requirements: enchantment.craftingrequirements,
    });
  }
}

const uniqueOutputItems = [...new Map(outputItems.map((item) => [item.itemId, item])).values()]
  .sort(stableSortItems);
const uniqueMaterialItems = [...materialItems.values()].sort(stableSortItems);
const sortedRecipes = recipes.sort(stableSortRecipes);

const file = `// Generated by scripts/sync-albion-crafting-data.mjs from ao-data/ao-bin-dumps.
// Do not edit manually.

export const generatedCraftingItems = ${JSON.stringify(uniqueOutputItems, null, 2)};

export const generatedMaterialItems = ${JSON.stringify(uniqueMaterialItems, null, 2)};

export const generatedCraftingRecipes = ${JSON.stringify(sortedRecipes, null, 2)};
`;

await writeFile(OUTPUT_PATH, file);

console.log(`Generated ${uniqueOutputItems.length} craftable items, ${uniqueMaterialItems.length} materials and ${sortedRecipes.length} recipes.`);
