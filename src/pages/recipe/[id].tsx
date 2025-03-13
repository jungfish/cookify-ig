import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getRecipeById } from '@/services/databaseService';
import type { Recipe } from '@/types/recipe';
import { UtensilsCrossed, ListOrdered, ScrollText } from 'lucide-react';

const RecipePage = () => {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          console.log('Parsed data:', data);
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!recipe) return <div>Recipe not found</div>;

  return (
    <div className="min-h-screen bg-[#faf7f2]">
      {/* Hero Section */}
      {recipe.illustration && (
        <div className="w-full h-[300px] relative overflow-hidden">
          <img
            src={recipe.illustration}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <h1 className="absolute bottom-8 left-1/2 -translate-x-1/2 text-4xl font-bold text-white text-center w-full max-w-4xl px-4">
            {recipe.title}
          </h1>
        </div>
      )}

      {/* Main content */}
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-3 gap-6">
          {/* Left column */}
          <div className="col-span-2">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <UtensilsCrossed className="w-6 h-6 text-gray-700" />
                <h2 className="text-xl font-semibold text-gray-700">Ingredients</h2>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index}>{ingredient}</li>
                ))}
              </ul>
            </div>

            <div className="mb-8">
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
                <div className="aspect-[9/16] w-full max-w-[240px] mx-auto bg-white rounded-lg shadow-md p-2">
                  <video
                    controls
                    className="w-full h-full rounded object-cover"
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