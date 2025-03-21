import { useEffect, useState } from "react";
import URLInput from "@/components/URLInput";
import RecipePreview from "@/components/RecipePreview";
import type { Recipe } from "@/types/recipe";
import { Link } from "react-router-dom";

const Index = () => {
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    // Fetch 4 most recent recipes
    fetch('/api/db')
      .then(res => res.json())
      .then(recipes => setRecentRecipes(recipes.slice(0, 4)))
      .catch(console.error);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100">
      {/* Hero Section */}
      <div className="flex items-center justify-center p-4 min-h-[70vh]">
        <URLInput />
      </div>

      {/* Recent Recipes Section */}
      {recentRecipes.length > 0 && (
        <div className="container mx-auto px-4 pb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Dernières recettes</h2>
            <p className="text-gray-600">Découvrez les dernières recettes ajoutées</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentRecipes.map((recipe) => (
              <RecipePreview key={recipe.id} recipe={recipe} />
            ))}
          </div>

          <div className="text-center mt-8">
            <Link 
              to="/recipes" 
              className="inline-block px-6 py-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all text-gray-800 font-medium"
            >
              Voir toutes les recettes
            </Link>
          </div>
        </div>
      )}
    </main>
  );
};

export default Index;
