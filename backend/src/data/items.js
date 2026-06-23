const tiered = (baseId, baseName, category, tiers = [4, 5, 6, 7, 8]) =>
  tiers.map((tier) => ({
    itemId: `T${tier}_${baseId}`,
    name: `${baseName} T${tier}`,
    category,
    tier,
    enchantment: 0,
  }));

export const items = [
  ...tiered('POTION_HEAL', 'Pocao de cura', 'Pocoes'),
  ...tiered('POTION_ENERGY', 'Pocao de energia', 'Pocoes'),
  ...tiered('POTION_COOLDOWN', 'Pocao de resistencia', 'Pocoes'),
  ...tiered('MEAL_STEW', 'Ensopado', 'Comidas'),
  ...tiered('MEAL_SANDWICH', 'Sanduiche', 'Comidas'),
  ...tiered('MEAL_OMELETTE', 'Omelete', 'Comidas'),
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

export const itemById = new Map(items.map((item) => [item.itemId, item]));

export const categories = [...new Set(items.map((item) => item.category))];
