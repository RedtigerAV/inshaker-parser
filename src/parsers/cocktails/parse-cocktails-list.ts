import * as cheerio from "cheerio";
import { CocktailPreview } from "../../models";
import { logger } from "./logger";

export function parseCocktailsListPage(html: string): CocktailPreview[] {
    const $ = cheerio.load(html);
    const cocktailsElements = $(".cocktail-item");
    const cocktails: CocktailPreview[] = [];

    for (let element of cocktailsElements) {
            const $el = $(element);
            const id = +$el.attr("data-id")!;
            const name = $el.find(".cocktail-item-name").text();
            const previewImageUrl = $el.find(".cocktail-item-image").attr("src");
            const link = $el.find(".cocktail-item-preview").attr("href");

            if (!id || Number.isNaN(id) || !name || !link) {
                logger.warning(`Invalid cocktail data: ${JSON.stringify({ id, name, previewImageUrl, link })}`);
                continue;
            }

            if (!previewImageUrl) {
                logger.warning(`No preview image for cocktail ${id}: ${name}`);
            }

            cocktails.push({ originalId: id, name, previewImageUrl, link });
    }

    return cocktails;
}