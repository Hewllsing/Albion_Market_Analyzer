const gearRecipe = (itemId, materialItemId, quantity) => ({
  itemId,
  materials: [{ itemId: materialItemId, quantity }],
});

export const recipes = [
  gearRecipe('T4_MAIN_SWORD', 'T4_METALBAR', 16),
  gearRecipe('T5_MAIN_SWORD', 'T5_METALBAR', 16),
  gearRecipe('T6_MAIN_SWORD', 'T6_METALBAR', 16),
  gearRecipe('T7_MAIN_SWORD', 'T7_METALBAR', 16),
  gearRecipe('T8_MAIN_SWORD', 'T8_METALBAR', 16),
  gearRecipe('T4_2H_BOW', 'T4_PLANKS', 32),
  gearRecipe('T5_2H_BOW', 'T5_PLANKS', 32),
  gearRecipe('T6_2H_BOW', 'T6_PLANKS', 32),
  gearRecipe('T7_2H_BOW', 'T7_PLANKS', 32),
  gearRecipe('T8_2H_BOW', 'T8_PLANKS', 32),
  gearRecipe('T4_ARMOR_PLATE_SET1', 'T4_METALBAR', 16),
  gearRecipe('T5_ARMOR_PLATE_SET1', 'T5_METALBAR', 16),
  gearRecipe('T6_ARMOR_PLATE_SET1', 'T6_METALBAR', 16),
  gearRecipe('T4_ARMOR_LEATHER_SET1', 'T4_LEATHER', 16),
  gearRecipe('T5_ARMOR_LEATHER_SET1', 'T5_LEATHER', 16),
  gearRecipe('T6_ARMOR_LEATHER_SET1', 'T6_LEATHER', 16),
  gearRecipe('T4_ARMOR_CLOTH_SET1', 'T4_CLOTH', 16),
  gearRecipe('T5_ARMOR_CLOTH_SET1', 'T5_CLOTH', 16),
  gearRecipe('T6_ARMOR_CLOTH_SET1', 'T6_CLOTH', 16),
];

export const recipeByItemId = new Map(recipes.map((recipe) => [recipe.itemId, recipe]));
