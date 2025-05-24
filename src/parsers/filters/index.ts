import * as cheerio from "cheerio";
import { delay, fetchHtml, ParserLogger, readConfig, saveJSON, tryCatch } from "../../utils";
import { Filter } from "../../models";

const logger = new ParserLogger('filters');

async function main() {
    console.log('ℹ️ Starting filters parser');

    logger.info('Reading config file');
    const { url, outputDir, parsedFilters } = readConfig();
    
    logger.success('CONFIG:');
    logger.success(`URL: ${url}`, 2);
    logger.success(`Output Directory: ${outputDir}`, 2);
    logger.success(`Found ${parsedFilters.length} filters places to parse:`, 2);

    for (const { name, path, outputFile } of parsedFilters) {
        logger.success(`Filter: ${name}`, 4);
        logger.success(`Path: ${path}`, 4);
        logger.success(`Output File: ${outputFile}\n`, 4);
    }
    
    for (const { name, path, outputFile } of parsedFilters) {
        const output = `${outputDir}/${outputFile}`;

        logger.info(`Parsing filter: ${name}`);
        logger.info(`Fetching filter page: ${url}/${path}`);
        
        await delay(1000);
        const [filterPage, filterFetchError] = await tryCatch(fetchHtml(`${url}/${path}`));

        if (filterFetchError) {
            logger.error(`Failed to fetch filter page: ${name}`);
            logger.error(filterFetchError.toString());
            continue;
        }

        logger.success(`Fetched filter page: ${name}`);

        logger.info(`Parsing filter page: ${name}`);
        const [filters, parseFilterError] = tryCatch(() => parseFiltersPage(filterPage));

        if (parseFilterError) {
            logger.error(`Failed to parse filter page: ${name}`);
            logger.error(parseFilterError.toString());
            continue;
        }

        logger.success(`Parsed filter page: ${name}`);
        logger.info(`Saving parsed filters to file: ${output}`);

        const [_, saveError] = await tryCatch(saveJSON(filters, output));

        if (saveError) {
            logger.error(`Failed to save parsed filters to file: ${output}`);
            logger.error(saveError.toString());
            continue;
        }

        logger.success(`Saved parsed filters to file: ${output}`);
    }
}

function parseFiltersPage(html: string): Filter[] {
    const $ = cheerio.load(html);
    const { filters } = $.extract({
        filters: [{
            selector: ".filters .filter",
            value: {
                name: ".current .mobile",
                options: [".item span"]
            }
        }]
    });

    return filters
        .map(({ name, options }) => {
            const isNameValid = name && typeof name === 'string';
            const isOptionsValid = options && Array.isArray(options) && options.every(option => typeof option === 'string');

            return isNameValid && isOptionsValid
                ? { name: name.trim(), options }
                : null;
        })
        .filter((filter): filter is Filter => filter !== null);
}

main();