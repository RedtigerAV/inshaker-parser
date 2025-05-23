
import * as cheerio from "cheerio";
import { CocktailDetails, CocktailIngredient } from "../../models";
import { tryCatch } from "../../utils";
import { logger } from "./logger";

export function parseCocktailPage(html: string): CocktailDetails {
    const $ = cheerio.load(html);

    const [imageUrl, imageUrlError] = tryCatch(() => parseCocktailImageUrl($));
    logParseResult(imageUrl, imageUrlError, 'Image URL');

    const [description, descriptionError] = tryCatch(() => parseCocktailDescription($));
    logParseResult(description, descriptionError, 'Description');

    const [tags, tagsError] = tryCatch(() => parseCocktailTags($));
    logParseResult(tags, tagsError, 'Tags');

    const [ingredients, ingredientsError] = tryCatch(() => parseCocktailIngredients($));
    logParseResult(ingredients, ingredientsError, 'Ingredients');

    const [tools, toolsError] = tryCatch(() => parseCocktailTools($));
    logParseResult(tools, toolsError, 'Tools');

    const [recipe, recipeError] = tryCatch(() => parseCocktailRecipe($));
    logParseResult(recipe, recipeError, 'Recipe');

    const [similarCocktailIds, similarCocktailIdsError] = tryCatch(() => parseSimilarCocktailIds($));
    logParseResult(similarCocktailIds, similarCocktailIdsError, 'Similar Cocktails');

    if (!imageUrl || !ingredients || !tools || !recipe) {
        throw new Error('Invalid cocktail data');
    }

    return { imageUrl, description: description || undefined, tags: tags || [], similarCocktailIds: similarCocktailIds || [], ingredients, tools, recipe };
}

function logParseResult(result: any, error: any, element: string) {
    if (!!error) {
        logger.error(`${element}: parsing error`, 2);
        logger.error(error.toString(), 2);
    }

    if (!error && !result) { logger.warning(`${element}: no data parsed`, 2); }
    if (!error && result) { logger.success(`${element}: parsed`, 2); }
}

function parseCocktailImageUrl($: cheerio.CheerioAPI): string | undefined {
    return $('.common-image-frame').attr('lazy-bg');
}

function parseCocktailDescription($: cheerio.CheerioAPI): string | undefined {
    return $('blockquote.body p')?.text()?.trim();
}

function parseCocktailTags($: cheerio.CheerioAPI): string[] | null {
    const tags = $('ul.tags .tag').map((_, el) => $(el).text().trim()).get();

    return tags?.length ? tags : null;
}

function parseCocktailIngredients($: cheerio.CheerioAPI): CocktailIngredient[] | null {
    const { ingredients } = $.extract({
        ingredients: [{
            selector: ".ingredient-tables table:first-child tr:not(:first-child)",
            value: {
                ingredientId: {
                    selector: ".name .js-tracking-ingredient",
                    value: (el) => +$(el).data("id")!
                },
                name: ".name .js-tracking-ingredient",
                amount: ".amount",
                unit: ".unit"
            }
        }],
    });

    const result = ingredients.map(({ ingredientId, name, amount, unit }) => {
        if (!ingredientId || Number.isNaN(ingredientId) || !name || !amount || !unit) {
            throw new Error(`Invalid ingredient data: ${JSON.stringify({ ingredientId, name, amount, unit })}`);
        }

        return { ingredientId, name, amount, unit };
    });

    return result?.length ? result : null;
}

function parseCocktailTools($: cheerio.CheerioAPI): CocktailIngredient[] | null {
    const { tools } = $.extract({
        tools: [{
            selector: ".ingredient-tables table:last-child tr:not(:first-child)",
            value: {
                ingredientId: {
                    selector: ".name a",
                    value: (el) => +$(el).attr("href")!.split("/").pop()!
                },
                name: ".name a",
                amount: ".amount",
                unit: ".unit"
            }
        }],
    });

    const result = tools.map(({ ingredientId, name, amount, unit }) => {
        if (!ingredientId || Number.isNaN(ingredientId) || !name || !amount || !unit) {
            throw new Error(`Invalid ingredient data: ${JSON.stringify({ ingredientId, name, amount, unit })}`);
        }

        return { ingredientId, name, amount, unit };
    });

    return result?.length ? result : null;
}

function parseCocktailRecipe($: cheerio.CheerioAPI): string[] | null {
    const recipe = $(".recipe .steps li").map((_, el) => $(el).text().trim()).get();

    return recipe?.length ? recipe : null;
}

function parseSimilarCocktailIds($: cheerio.CheerioAPI): number[] | null {
    const similatCocktailLinks = $(".faq-block .faq-block__item:nth-child(2) .faq-block__answer a");
    const similarCocktailHrefs = (similatCocktailLinks || []).map((_, el) => $(el).attr("href")).get();

    if (!similarCocktailHrefs.length) {
        return null;
    }

    const similarCocktailIds = similarCocktailHrefs.map(href => {
        const hrefWithoutPrefix = href?.replace("/cocktails/", "");

        if (!hrefWithoutPrefix) {
            throw new Error(`Invalid href of cocktail: ${href}`);
        }

        return  parseInt(hrefWithoutPrefix, 10);
    });

    return similarCocktailIds?.length ? similarCocktailIds : null;
}