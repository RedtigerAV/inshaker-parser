export interface CocktailPreview {
    id: number;
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

export interface CocktailIngredient {
    ingredientId: number;
    name: string;
    amount: string;
    unit: string;
}

export type Cocktail = CocktailPreview & CocktailDetails;