import { CocktailIngredient } from "./ingredient.model";

export interface CocktailPreview {
    originalId: number;
    name: string;
    link: string;
    previewImageUrl?: string;
}

export interface CocktailDetails {
    imageUrl: string;
    description?: string;
    tags: string[];
    ingredients: CocktailIngredient[];
    tools: CocktailIngredient[];
    similarCocktailIds: number[];
    recipe: string[];
}

export type Cocktail = CocktailPreview & CocktailDetails;