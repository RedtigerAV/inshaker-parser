import * as cheerio from "cheerio";
import { IngredientDetails } from "../../models";
import { tryCatch } from "../../utils";
import { logger } from "./logger";

export function parseIngredient(html: string): IngredientDetails {
    const $ = cheerio.load(html);

    const [imageUrl, imageUrlError] = tryCatch(() => parseIngredientImageUrl($));
    logger.logParseResult(imageUrl, imageUrlError, 'Image URL');

    const [description, descriptionError] = tryCatch(() => parseIngredientDescription($));
    logger.logParseResult(description, descriptionError, 'Description');

    const [tags, tagsError] = tryCatch(() => parseIngredientTags($));
    logger.logParseResult(tags, tagsError, 'Tags');

    const [relatedIds, relatedIdsError] = tryCatch(() => parseRelatedIngredients($));
    logger.logParseResult(relatedIds, relatedIdsError, 'Related Ingredients');

    if (!imageUrl) {
        throw new Error('Invalid cocktail data');
    }

    return { imageUrl, description: description || undefined, tags: tags || [], relatedIngredientIds: relatedIds || [] };
}

function parseIngredientImageUrl($: cheerio.CheerioAPI): string | undefined {
    const style = $('.goods-photo').attr('style');

    if (!style) return undefined;

    const match = style.match(/url\(['"]?([^'")]+)['"]?\)/);
    if (!match) return undefined;

    return match[1];
}

function parseIngredientDescription($: cheerio.CheerioAPI): string | undefined {
    return $('#goods-text')?.text()?.trim();
}

function parseIngredientTags($: cheerio.CheerioAPI): string[] | null {
    const tags = $('ul.tags .tag').map((_, el) => $(el).text().trim()).get();

    return tags?.length ? tags : null;
}

function parseRelatedIngredients($: cheerio.CheerioAPI): number[] | null {
    const related = $('.common-box ul.goods li a').map((_, el) => {
        const href = $(el).attr('href');
        if (!href) return null;

        const id = href.split('/').pop();
        if (!id || isNaN(+id)) return null;

        return +id;
    }).get().filter(Boolean);

    return related?.length ? related : null;
}