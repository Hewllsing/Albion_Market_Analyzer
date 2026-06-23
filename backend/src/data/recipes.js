import { generatedCraftingRecipes } from './generatedCraftingData.js';

export const craftingGroups = [
  { key: 'food', label: 'Comidas', categories: ['Comidas'] },
  { key: 'potions', label: 'Pocoes', categories: ['Pocoes'] },
  { key: 'equipment', label: 'Equipamentos', categories: ['Armas', 'Armaduras'] },
];

export const recipes = generatedCraftingRecipes;

export const recipeByItemId = new Map(recipes.map((entry) => [entry.itemId, entry]));

export const defaultCraftingRankingItemIds = [
  'T4_MEAL_STEW',
  'T5_MEAL_STEW',
  'T6_MEAL_STEW',
  'T4_MEAL_SANDWICH',
  'T5_MEAL_SANDWICH',
  'T6_MEAL_SANDWICH',
  'T4_POTION_HEAL',
  'T6_POTION_HEAL',
  'T4_POTION_ENERGY',
  'T6_POTION_ENERGY',
  'T4_MAIN_SWORD',
  'T5_MAIN_SWORD',
  'T6_MAIN_SWORD',
  'T4_2H_BOW',
  'T5_2H_BOW',
  'T6_2H_BOW',
  'T4_MAIN_FIRESTAFF',
  'T5_MAIN_FIRESTAFF',
  'T6_MAIN_FIRESTAFF',
  'T4_ARMOR_PLATE_SET1',
  'T5_ARMOR_PLATE_SET1',
  'T6_ARMOR_PLATE_SET1',
  'T4_ARMOR_LEATHER_SET1',
  'T5_ARMOR_LEATHER_SET1',
  'T6_ARMOR_LEATHER_SET1',
  'T4_ARMOR_CLOTH_SET1',
  'T5_ARMOR_CLOTH_SET1',
  'T6_ARMOR_CLOTH_SET1',
].filter((itemId) => recipeByItemId.has(itemId));

export const getRecipeGroup = (itemId) => recipeByItemId.get(itemId)?.group || null;
