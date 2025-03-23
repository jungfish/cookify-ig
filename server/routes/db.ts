import { Router, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all recipes
const getAllRecipes: RequestHandler = async (req, res) => {
  try {
    const recipes = await prisma.recipe.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(recipes);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
};

// Get single recipe by ID
const getRecipeById: RequestHandler<{ id: string }> = async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await prisma.recipe.findUnique({
      where: { id }
    });

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    // Parse JSON strings
    const cleanRecipe = {
      ...recipe,
      ingredients: recipe.ingredients ? JSON.parse(recipe.ingredients) : [],
      instructions: recipe.instructions ? JSON.parse(recipe.instructions) : []
    };

    res.json(cleanRecipe);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
};

// Create or update recipe
const createOrUpdateRecipe: RequestHandler = async (req, res) => {
  try {
    const recipe = req.body;
    
    // Validate required fields
    if (!recipe.title || !recipe.category) {
      return res.status(400).json({ 
        error: 'Missing required fields: title and category are required' 
      });
    }

    // Check if recipe with same URL exists
    let existingRecipe = null;
    if (recipe.url) {
      existingRecipe = await prisma.recipe.findFirst({
        where: { url: recipe.url }
      });
    }

    const recipeData = {
      title: recipe.title,
      category: recipe.category,
      ingredients: recipe.ingredients ? JSON.stringify(recipe.ingredients) : '[]',
      instructions: recipe.instructions ? JSON.stringify(recipe.instructions) : '[]',
      illustration: recipe.illustration,
      url: recipe.url,
      videoUrl: recipe.videoUrl,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      totalTime: recipe.totalTime,
      servings: recipe.servings
    };

    let savedRecipe;
    if (existingRecipe) {
      savedRecipe = await prisma.recipe.update({
        where: { id: existingRecipe.id },
        data: recipeData,
      });
    } else {
      savedRecipe = await prisma.recipe.create({
        data: recipeData,
      });
    }

    res.json(savedRecipe);
  } catch (error) {
    console.error('Error saving recipe:', error);
    res.status(500).json({ error: 'Failed to save recipe' });
  }
};

// Update recipe
router.put('/:id', async (req, res) => {
  try {
    const updatedRecipe = await prisma.recipe.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(updatedRecipe);
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({ error: 'Failed to update recipe' });
  }
});

router.get('/', getAllRecipes);
router.get('/:id', getRecipeById);
router.post('/', createOrUpdateRecipe);

export default router; 