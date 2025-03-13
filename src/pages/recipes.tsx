import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllRecipes } from '@/services/databaseService';
import type { Recipe } from '@/types/recipe';
import ParallaxHero from '@/components/ParallaxHero';

const RecipesPage = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        const data = await getAllRecipes();
        console.log('Fetched recipes:', data);
        setRecipes(data);
      } catch (err) {
        console.error('Error fetching recipes:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch recipes');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  if (loading) {
    return <div className="container mx-auto p-8">Loading...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-[#faf7f2]">
      <ParallaxHero
        imageUrl="https://images.unsplash.com/photo-1495521821757-a1efb6729352"
        title="My Recipes Collection"
        height="h-[250px]"
      />
      
      <div className="container mx-auto p-8 -mt-8 relative z-10">
        <h1 className="text-3xl font-bold mb-8">My Recipes</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <Link 
              key={recipe.id} 
              to={`/recipe/${recipe.id}`}
              className="group block overflow-hidden rounded-xl bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20"
            >
              {recipe.illustration && (
                <div className="h-48 overflow-hidden">
                  <img
                    src={recipe.illustration}
                    alt={recipe.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-4 bg-white/50 backdrop-blur-sm">
                <h2 className="text-xl font-semibold mb-2 text-gray-800">{recipe.title}</h2>
                <span className="inline-block px-3 py-1 bg-white/70 backdrop-blur-sm rounded-full text-sm text-gray-700 shadow-sm">
                  {recipe.category}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecipesPage; 