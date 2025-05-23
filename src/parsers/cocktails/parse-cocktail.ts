
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

    const [goods, goodsError] = tryCatch(() => parseCocktailGoods($));
    logParseResult(goods, goodsError, 'Goods');

    const [recipe, recipeError] = tryCatch(() => parseCocktailRecipe($));
    logParseResult(recipe, recipeError, 'Recipe');

    if (!imageUrl || !ingredients || !goods || !recipe) {
        throw new Error('Invalid cocktail data');
    }

    return { imageUrl, description: description || undefined, tags: tags || [], ingredients, goods, recipe };
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

function parseCocktailGoods($: cheerio.CheerioAPI): CocktailIngredient[] | null {
    const { goods } = $.extract({
        goods: [{
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

    const result = goods.map(({ ingredientId, name, amount, unit }) => {
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