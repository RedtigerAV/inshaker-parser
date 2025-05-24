import * as cheerio from "cheerio";
import { logger } from "./logger";
import { IgredientPreviewCategory, IngredientPreview } from "../../models";
import { Element } from "domhandler";
import { tryCatch } from "../../utils";

export function parseIngredientsListPage(html: string): IgredientPreviewCategory[] {
    const $ = cheerio.load(html);
    const categories = $(".goods .group:not(:first-child)");
    const result: IgredientPreviewCategory[] = [];

    for (let categoryEl of categories) {
        const $category = $(categoryEl);

        const categoryName = $category.find(".head").text().trim();
        const ingredients = $category.find("li.item a");
        const category: IgredientPreviewCategory = { name: categoryName, ingredients: [] };

        for (let ingredientEl of ingredients) {
            const [ingredient, error] = tryCatch(() => parseIngredientPreview($(ingredientEl)));

            if (error) {
                logger.warning(error.message);
                continue;
            }

            category.ingredients.push(ingredient);
        }

        if (category.ingredients.length > 0) {
            result.push(category);
            logger.success(`Parsed category: ${categoryName} with ${category.ingredients.length} ingredients`);
        } else {
            logger.warning(`No ingredients found in category: ${categoryName}`);
        }
    }

    return result;
}

function parseIngredientPreview($: cheerio.Cheerio<Element>): IngredientPreview {
    const name = $.find(".name").text().trim()!;
    const link = $.attr("href")!;
    const id = +(link.split("/").pop()!);
    const previewImageUrl = $.find(".icon").attr("lazy-bg")!;
    const hexColor = $.find(".icon").attr("style")?.replace("background-color:", "").trim()!;

    if (!name || !link || !id || !previewImageUrl) {
        throw new Error(`Failed to parse ingredient preview: ${JSON.stringify({ id, name, previewImageUrl, link })}`);
    }

    if (!hexColor) {
        logger.warning(`No hex color found for ingredient: ${name} (${id})`);
    }

    return {
        id,
        name,
        previewImageUrl,
        link,
        hexColor,
    };
}