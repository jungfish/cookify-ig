import { interpretRecipe, generateRecipeImage } from './mistralService';
import type { Recipe } from "@/types/recipe";
import { saveRecipe } from './databaseService';

export async function processRecipeFromInstagram(
  caption: string, 
  transcription: string, 
  thumbnailUrl?: string, 
  videoUrl?: string
): Promise<Recipe> {
  try {
    // Get recipe interpretation from Mistral
    const recipe = await interpretRecipe(caption, transcription);
    
    // Generate custom illustration if no thumbnail provided
    const illustration = await generateRecipeImage(recipe.title, recipe.ingredients) || thumbnailUrl;
    
    // Prepare recipe data with video URL
    const processedRecipe: Recipe = {
      title: recipe.title || 'Untitled Recipe',
      category: recipe.category || 'Plat principal',
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || [],
      illustration,
      url: thumbnailUrl,
      videoUrl // Add video URL from Instagram media endpoint
    };

    // Save the recipe to the database
    const savedRecipe = await saveRecipe(processedRecipe);
    
    return savedRecipe;
  } catch (error) {
    console.error('Error processing recipe:', error);
    throw error;
  }
}
