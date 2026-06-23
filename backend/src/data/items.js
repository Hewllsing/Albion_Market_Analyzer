import { generatedCraftingItems, generatedMaterialItems } from './generatedCraftingData.js';

const tiered = (baseId, baseName, category, tiers = [4, 5, 6, 7, 8]) =>
  tiers.map((tier) => ({
    itemId: `T${tier}_${baseId}`,
    name: `${baseName} T${tier}`,
    category,
    tier,
    enchantment: 0,
  }));

const single = (itemId, name, category, tier) => ({
  itemId,
  name,
  category,
  tier,
  enchantment: 0,
});

const ingredients = [
  single('T1_CARROT', 'Cenoura', 'Ingredientes', 1),
  single('T2_BEAN', 'Feijao', 'Ingredientes', 2),
  single('T3_WHEAT', 'Trigo', 'Ingredientes', 3),
  single('T4_TURNIP', 'Nabo', 'Ingredientes', 4),
  single('T5_CABBAGE', 'Repolho', 'Ingredientes', 5),
  single('T6_POTATO', 'Batata', 'Ingredientes', 6),
  single('T7_CORN', 'Milho', 'Ingredientes', 7),
  single('T8_PUMPKIN', 'Abobora', 'Ingredientes', 8),
  single('T2_AGARIC', 'Cogumelo arcano', 'Ingredientes', 2),
  single('T3_COMFREY', 'Confrei brilhante', 'Ingredientes', 3),
  single('T4_BURDOCK', 'Bardana crenelada', 'Ingredientes', 4),
  single('T5_TEASEL', 'Cardo dragao', 'Ingredientes', 5),
  single('T6_FOXGLOVE', 'Dedaleira evasiva', 'Ingredientes', 6),
  single('T7_MULLEIN', 'Verbasco tocado pelo fogo', 'Ingredientes', 7),
  single('T8_YARROW', 'Milefolio espectral', 'Ingredientes', 8),
  single('T3_EGG', 'Ovos de galinha', 'Ingredientes', 3),
  single('T4_MILK', 'Leite de cabra', 'Ingredientes', 4),
  single('T5_EGG', 'Ovos de ganso', 'Ingredientes', 5),
  single('T6_MILK', 'Leite de ovelha', 'Ingredientes', 6),
  single('T8_MILK', 'Leite de vaca', 'Ingredientes', 8),
  single('T3_ALCOHOL', 'Alcool comum', 'Ingredientes', 3),
  single('T5_ALCOHOL', 'Alcool refinado', 'Ingredientes', 5),
  single('T7_ALCOHOL', 'Alcool potente', 'Ingredientes', 7),
];

const mergeItems = (...groups) => {
  const byId = new Map();
  groups.flat().forEach((item) => {
    if (!byId.has(item.itemId)) byId.set(item.itemId, item);
  });
  return [...byId.values()];
};

export const marketItems = [
  ...tiered('POTION_HEAL', 'Pocao de cura', 'Pocoes'),
  ...tiered('POTION_ENERGY', 'Pocao de energia', 'Pocoes'),
  ...tiered('POTION_COOLDOWN', 'Pocao de resistencia', 'Pocoes'),
  ...tiered('MEAL_STEW', 'Ensopado', 'Comidas'),
  ...tiered('MEAL_SANDWICH', 'Sanduiche', 'Comidas'),
  ...tiered('MEAL_OMELETTE', 'Omelete', 'Comidas'),
  ...ingredients,
  ...tiered('ORE', 'Minerio', 'Recursos brutos'),
  ...tiered('WOOD', 'Madeira', 'Recursos brutos'),
  ...tiered('FIBER', 'Fibra', 'Recursos brutos'),
  ...tiered('HIDE', 'Couro bruto', 'Recursos brutos'),
  ...tiered('ROCK', 'Pedra bruta', 'Recursos brutos'),
  ...tiered('METALBAR', 'Barra de metal', 'Recursos refinados'),
  ...tiered('PLANKS', 'Tabuas', 'Recursos refinados'),
  ...tiered('CLOTH', 'Tecido', 'Recursos refinados'),
  ...tiered('LEATHER', 'Couro', 'Recursos refinados'),
  ...tiered('STONEBLOCK', 'Bloco de pedra', 'Recursos refinados'),
  ...tiered('MAIN_SWORD', 'Espada larga', 'Armas'),
  ...tiered('2H_BOW', 'Arco', 'Armas'),
  ...tiered('MAIN_FIRESTAFF', 'Cajado de fogo', 'Armas'),
  ...tiered('MAIN_FROSTSTAFF', 'Cajado de gelo', 'Armas'),
  ...tiered('2H_DUALAXE', 'Machados duplos', 'Armas'),
  ...tiered('ARMOR_PLATE_SET1', 'Armadura de soldado', 'Armaduras'),
  ...tiered('ARMOR_LEATHER_SET1', 'Jaqueta de mercenario', 'Armaduras'),
  ...tiered('ARMOR_CLOTH_SET1', 'Robe de estudioso', 'Armaduras'),
  ...tiered('HEAD_PLATE_SET1', 'Elmo de soldado', 'Armaduras'),
  ...tiered('SHOES_LEATHER_SET1', 'Sapatos de mercenario', 'Armaduras'),
];

export const items = mergeItems(marketItems, generatedCraftingItems, generatedMaterialItems);

export const itemById = new Map(items.map((item) => [item.itemId, item]));

export const categories = [...new Set(items.map((item) => item.category))];
