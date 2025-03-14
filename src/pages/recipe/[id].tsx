import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getRecipeById } from '@/services/databaseService';
import type { Recipe } from '@/types/recipe';
import { UtensilsCrossed, ListOrdered, ScrollText } from 'lucide-react';
import ParallaxHero from '@/components/ParallaxHero';

const RecipePage = () => {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [servingMultiplier, setServingMultiplier] = useState(1);

  useEffect(() => {
    async function fetchRecipe() {
      try {
        setLoading(true);
        if (!id) throw new Error('Recipe ID is required');
        
        const response = await fetch(`/api/db/${id}`);
        const text = await response.text(); // Get raw response text
        console.log('Raw response:', text);
        
        try {
          const data = JSON.parse(text);
          console.log('Recipe data:', data);
          console.log('Servings value:', data.servings);
          setRecipe(data);
        } catch (parseError) {
          console.error('Parse error:', parseError);
          setError('Failed to parse recipe data');
        }
      } catch (error) {
        console.error('Fetch error:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch recipe');
      } finally {
        setLoading(false);
      }
    }

    fetchRecipe();
  }, [id]);

  // Function to adjust ingredient quantities
  const adjustIngredient = (ingredient: string, multiplier: number) => {
    const regex = /^(\d+(?:[,.]\d+)?)\s*(.+)$/;
    const match = ingredient.match(regex);
    
    if (match) {
      const [_, quantity, rest] = match;
      const adjustedQuantity = parseFloat(quantity.replace(',', '.')) * multiplier;
      return `${adjustedQuantity.toFixed(1).replace('.0', '')} ${rest}`;
    }
    return ingredient;
  };

  // Add this function to safely get servings
  const getServings = () => {
    if (!recipe) return 4;
    const servings = Number(recipe.servings);
    return isNaN(servings) ? 4 : servings;
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!recipe) return <div>Recipe not found</div>;

  return (
    <div className="min-h-screen bg-[#faf7f2]">
      {/* Hero Section */}
      {recipe.illustration && (
        <ParallaxHero
          imageUrl={recipe.illustration}
          title={recipe.title}
        />
      )}

      {/* Main content */}
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-3 gap-6">
          {/* Left column */}
          <div className="col-span-2">
            {/* Serving size adjuster */}
            <div className="mb-4 p-4 rounded-xl bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg">
              <div className="flex items-center gap-4">
                <span className="text-gray-700">Nombre de personnes:</span>
                <button 
                  className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
                  onClick={() => setServingMultiplier(prev => Math.max(0.5, prev - 0.5))}
                >
                  -
                </button>
                <span className="w-12 text-center">
                  {Math.round(getServings() * servingMultiplier)}
                </span>
                <button 
                  className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
                  onClick={() => setServingMultiplier(prev => prev + 0.5)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Ingredients section with adjusted quantities */}
            <div className="mb-8 p-6 rounded-xl bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <UtensilsCrossed className="w-6 h-6 text-gray-700" />
                <h2 className="text-xl font-semibold text-gray-700">Ingredients</h2>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index}>
                    {adjustIngredient(ingredient, servingMultiplier)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-8 p-6 rounded-xl bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <ListOrdered className="w-6 h-6 text-gray-700" />
                <h2 className="text-xl font-semibold text-gray-700">Instructions</h2>
              </div>
              <ol className="list-decimal pl-5 space-y-3 text-gray-600">
                {recipe.instructions.map((step, index) => (
                  <li key={index} className="leading-relaxed">{step}</li>
                ))}
              </ol>
            </div>
          </div>

          {/* Right column */}
          <div className="col-span-1">
            <div className="sticky top-24 pt-4">
              {recipe.videoUrl && (
                <div className="aspect-[9/16] w-full max-w-[240px] mx-auto bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-3">
                  <video
                    controls
                    className="w-full h-full rounded-lg"
                    src={recipe.videoUrl}
                    playsInline
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipePage; 