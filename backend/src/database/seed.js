import { items } from '../data/items.js';
import { refiningRecipes } from '../data/refiningRecipes.js';
import { recipes } from '../data/recipes.js';
import { getPool } from './connection.js';

const database = getPool();
if (!database) throw new Error('Configure o banco no .env antes de executar o seed.');

const connection = await database.getConnection();
try {
  await connection.beginTransaction();
  await connection.query(
    `INSERT INTO items (item_id, name, category, tier, enchantment) VALUES ?
     ON DUPLICATE KEY UPDATE
       name = VALUES(name), category = VALUES(category), tier = VALUES(tier),
       enchantment = VALUES(enchantment)`,
    [items.map((item) => [item.itemId, item.name, item.category, item.tier, item.enchantment])],
  );

  const allRecipes = [...recipes, ...refiningRecipes];
  const recipeRows = allRecipes.flatMap((recipe) => recipe.materials.map((material) => [
    recipe.itemId, material.itemId, material.quantity,
  ]));
  await connection.query(
    `INSERT INTO crafting_recipes (item_id, material_item_id, quantity) VALUES ?
     ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)`,
    [recipeRows],
  );
  await connection.commit();
  console.log(`${items.length} itens e ${recipeRows.length} materiais de receita sincronizados.`);
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
  await database.end();
}
