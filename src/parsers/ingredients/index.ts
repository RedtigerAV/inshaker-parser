import { IngredientCategory } from "../../models";
import { delay, fetchHtml, readConfig, saveJSON, tryCatch } from "../../utils";
import { logger } from "./logger";
import { parseIngredient } from "./parse-ingredient";
import { parseIngredientsListPage } from "./parse-ingredients-list";

async function main() {
    console.log('ℹ️ Starting ingredients parser');

    logger.info('Reading config file');
    const { url, outputDir, parsedIngredientsFile } = readConfig();
    const output = `${outputDir}/${parsedIngredientsFile}`;
    logger.success('CONFIG:');
    logger.success(`URL: ${url}`, 2);
    logger.success(`Output: ${output}`, 2);

    logger.info('Fetching ingredients list page');
    const [ingredientsListPage, ingredientsFetchError] = await tryCatch(fetchHtml(`${url}/goods`));

    if (ingredientsFetchError) {
        logger.error('Failed to fetch ingredients list page');
        logger.error(ingredientsFetchError.toString());
        return;
    }
    
    logger.success('Fetched ingredients list page');

    const [categoriesWithPreviews, parseListPageError] = tryCatch(() => parseIngredientsListPage(ingredientsListPage));
    const categories: IngredientCategory[] = [];

    if (parseListPageError) {
        logger.error('Failed to parse ingredients list page');
        logger.error(parseListPageError.message);
        return;
    }

    logger.success('Parsed ingredients list page\n');

    for (const { name, ingredients } of categoriesWithPreviews) {
        const category: IngredientCategory = { name, ingredients: [] };

        for (const ingredient of ingredients) {
            await delay(1000, 2000);
            logger.info(`Fetching ingredient page: ${ingredient.name} (ID: ${ingredient.id}). Link: ${ingredient.link}`);
            const [ingredientPage, ingredientFetchError] = await tryCatch(fetchHtml(`${url}/${ingredient.link}`));

            if (ingredientFetchError) {
                logger.error(`Failed to fetch ingredient page: ${ingredient.name} (ID: ${ingredient.id}). Link: ${ingredient.link}`);
                logger.error(ingredientFetchError.toString());
                continue;
            }

            logger.success(`Fetched ingredient page: ${ingredient.name} (ID: ${ingredient.id})`);
            logger.info(`Parsing ingredient page: ${ingredient.name} (ID: ${ingredient.id})`);

            const [parsedIngredient, parseIngredientError] = tryCatch(() => parseIngredient(ingredientPage));

            if (parseIngredientError) {
                logger.error(`Failed to parse ingredient page: ${ingredient.name} (ID: ${ingredient.id})`);
                logger.error(parseIngredientError.toString());
                continue;
            }

            category.ingredients.push({ ...ingredient, ...parsedIngredient });
            logger.success(`Parsed ingredient page: ${ingredient.name} (ID: ${ingredient.id})\n`);
        }

        categories.push(category);
        logger.success(`Parsed ingredients for category: ${category.name}. Total: ${category.ingredients.length}\n`);
    }

    logger.success('Parsed all ingredients');
    logger.info(`Saving ingredients to file: ${output}`);
    
    const [_, saveError] = await tryCatch(saveJSON(categories, output));

    if (saveError) {
        logger.error('Error saving ingredients');
        logger.error(saveError.toString());

        console.error('❌ Failed to save ingredients');
        return;
    }

    logger.success('Saved ingredients');
    console.log('✅ Successfully finished ingredients parser');
}

main();