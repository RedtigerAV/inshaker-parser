import fs from 'fs';
import { delay, getRandomInt, fetchHtml, tryCatch, saveJSON } from "../../utils";
import { Cocktail } from "../../models";
import { logger } from "./logger";
import { parseCocktailsListPage } from "./parse-cocktails-list";
import { parseCocktailPage } from "./parse-cocktail";

async function main(config: { url: string, output: string, pages: number }): Promise<void> {
    console.log('ℹ️ Starting cocktails parser');

    const [cocktailsListPage, cocktailsFetchError] = await tryCatch(fetchHtml(`${config.url}/cocktails?random_page=${config.pages}`));

    if (cocktailsFetchError) {
        logger.error('Error fetching cocktails list page');
        logger.error(cocktailsFetchError.toString());
        return;
    }

    logger.success('Fetched cocktails list page');

    const [cocktailsList, cocktailsParseError] = tryCatch(() => parseCocktailsListPage(cocktailsListPage));

    if (cocktailsParseError) {
        logger.error('Error parsing cocktails list page');
        logger.error(cocktailsParseError.toString());
        return;
    }

    logger.success(`Parsed cocktails list page, found ${cocktailsList.length} cocktails`);

    const cocktails: Cocktail[] = [];

    for (const cocktail of cocktailsList) {
        await delay(getRandomInt(1000, 1500));
        logger.info(`Fetching cocktail page: ${cocktail.originalId}: ${cocktail.name}`);

        const [cocktailPage, cocktailFetchError] = await tryCatch(fetchHtml(`${config.url}/${cocktail.link}`));

        if (cocktailFetchError) {
            logger.error(`Error fetching cocktail page: ${cocktail.originalId}: ${cocktail.name}; link: ${cocktail.link}`);
            logger.error(cocktailFetchError.toString() + '\n');
            continue;
        }

        logger.info(`Parsing cocktail page: ${cocktail.originalId}: ${cocktail.name}`);

        const [cocktailDetails, cocktailParseError] = tryCatch(() => parseCocktailPage(cocktailPage));

        if (cocktailParseError) {
            logger.error(`Error parsing cocktail page: ${cocktail.originalId}: ${cocktail.name}`);
            logger.error(cocktailParseError.toString() + '\n');
            continue;
        }

        cocktails.push({...cocktail, ...cocktailDetails});
        logger.success(`Parsed cocktail page: ${cocktail.originalId}: ${cocktail.name}\n`);
    }

    logger.success(`Parsed ${cocktails.length} cocktails`);

    const [_, saveError] = tryCatch(() => saveJSON(cocktails, config.output));

    if (saveError) {
        logger.error('Error saving cocktails');
        logger.error(saveError.toString());

        console.error('❌ Failed to save cocktails');
        return;
    }

    logger.success('Saved cocktails');
    console.log('✅ Successfully finished cocktails parser');
}

const args = process.argv.slice(2);
const configPath = args[0].split('=')[1];
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

main(config);