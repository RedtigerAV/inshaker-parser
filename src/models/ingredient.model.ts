export interface IgredientPreviewCategory {
    name: string;
    ingredients: IngredientPreview[];
}

export interface IngredientCategory {
    name: string;
    ingredients: Ingredient[];
}
export interface IngredientPreview {
    id: number;
    name: string;
    previewImageUrl: string;
    link: string;
    hexColor?: string;
}

export interface IngredientDetails {
    imageUrl: string;
    description?: string;
    tags: string[];
    relatedIngredientIds: number[];
}

export type Ingredient = IngredientPreview & IngredientDetails;