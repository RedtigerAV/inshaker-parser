import { delay, fetchHtml, tryCatch, saveJSON, readConfig } from "../../utils";
import { Cocktail } from "../../models";
import { logger } from "./logger";
import { parseCocktailsListPage } from "./parse-cocktails-list";
import { parseCocktailPage } from "./parse-cocktail";

async function main() {
    console.log('ℹ️ Starting cocktails parser');

    logger.info('Reading config file');
    const { url, outputDir, pages, parsedCocktailsFile } = readConfig();
    const output = `${outputDir}/${parsedCocktailsFile}`;
    logger.success('CONFIG:');
    logger.success(`URL: ${url}`, 2);
    logger.success(`Output: ${output}`, 2);
    logger.success(`Pages: ${pages}`, 2);

    logger.info('Fetching cocktails list page');
    const [cocktailsListPage, cocktailsFetchError] = await tryCatch(fetchHtml(`${url}/cocktails?random_page=${pages}`));

    if (cocktailsFetchError) {
        logger.error('Error fetching cocktails list page');
        logger.error(cocktailsFetchError.toString());
        return;
    }

    logger.success('Fetched cocktails list page');

    logger.info('Parsing cocktails list page');
    const [cocktailsList, cocktailsParseError] = tryCatch(() => parseCocktailsListPage(cocktailsListPage));

    if (cocktailsParseError) {
        logger.error('Error parsing cocktails list page');
        logger.error(cocktailsParseError.toString());
        return;
    }

    logger.success(`Parsed cocktails list page, found ${cocktailsList.length} cocktails`);

    const cocktails: Cocktail[] = [];

    for (const cocktail of cocktailsList) {
        await delay(1000, 2000);
        logger.info(`Fetching cocktail page: ${cocktail.id}: ${cocktail.name}`);

        const [cocktailPage, cocktailFetchError] = await tryCatch(fetchHtml(`${url}/${cocktail.link}`));

        if (cocktailFetchError) {
            logger.error(`Error fetching cocktail page: ${cocktail.id}: ${cocktail.name}; link: ${cocktail.link}`);
            logger.error(cocktailFetchError.toString() + '\n');
            continue;
        }

        logger.info(`Parsing cocktail page: ${cocktail.id}: ${cocktail.name}`);

        const [cocktailDetails, cocktailParseError] = tryCatch(() => parseCocktailPage(cocktailPage));

        if (cocktailParseError) {
            logger.error(`Error parsing cocktail page: ${cocktail.id}: ${cocktail.name}`);
            logger.error(cocktailParseError.toString() + '\n');
            continue;
        }

        cocktails.push({...cocktail, ...cocktailDetails});
        logger.success(`Parsed cocktail page: ${cocktail.id}: ${cocktail.name}\n`);
    }

    logger.success(`Parsed ${cocktails.length} cocktails`);

    const [_, saveError] = await tryCatch(saveJSON(cocktails, output));

    if (saveError) {
        logger.error('Error saving cocktails');
        logger.error(saveError.toString());

        console.error('❌ Failed to save cocktails');
        return;
    }

    logger.success('Saved cocktails');
    console.log('✅ Successfully finished cocktails parser');
}

main();