const refiningPair = (outputBaseId, inputBaseId, outputName, tiers = [4, 5, 6, 7, 8]) =>
  tiers.map((tier) => ({
    itemId: `T${tier}_${outputBaseId}`,
    name: `${outputName} T${tier}`,
    materials: [{ itemId: `T${tier}_${inputBaseId}`, quantity: 2 }],
  }));

export const refiningRecipes = [
  ...refiningPair('METALBAR', 'ORE', 'Barra de metal'),
  ...refiningPair('PLANKS', 'WOOD', 'Tabuas'),
  ...refiningPair('CLOTH', 'FIBER', 'Tecido'),
  ...refiningPair('LEATHER', 'HIDE', 'Couro'),
  ...refiningPair('STONEBLOCK', 'ROCK', 'Bloco de pedra'),
];

export const refiningRecipeByItemId = new Map(
  refiningRecipes.map((recipe) => [recipe.itemId, recipe]),
);
