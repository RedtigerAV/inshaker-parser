export interface Config {
    url: string;
    pages: number;
    outputDir: string;
    parsedFilters: Array<{ name: string; path: string, outputFile: string }>;
    parsedCocktailsFile: string;
    parsedIngredientsFile: string;
}