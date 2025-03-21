import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ParallaxHero from "@/components/ParallaxHero";
import { UtensilsCrossed } from "lucide-react";
import type { Recipe } from "@/types/recipe";

const categoryColors = {
  "Dessert": "bg-pink-100",
  "Soupe": "bg-amber-100",
  "Plat principal": "bg-emerald-100",
  "Entrée": "bg-blue-100",
  "Bébé": "bg-purple-100",
} as const;

const categories = ["Toutes", "Dessert", "Soupe", "Plat principal", "Entrée", "Bébé"] as const;

const RecipesPage = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Toutes");

  useEffect(() => {
    fetch('/api/db')
      .then(res => res.json())
      .then(setRecipes)
      .catch(console.error);
  }, []);

  const filteredRecipes = selectedCategory === "Toutes" 
    ? recipes 
    : recipes.filter(recipe => recipe.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#faf7f2]">
      <ParallaxHero
        imageUrl="https://images.unsplash.com/photo-1495521821757-a1efb6729352"
        title="Mes Recettes"
        height="h-[250px]"
      />
      
      <div className="container mx-auto p-8 -mt-8 relative z-10">
        {/* Category Filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                ${selectedCategory === category 
                  ? 'bg-gray-800 text-white shadow-lg scale-105' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Recipes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <Link 
              key={recipe.id} 
              to={`/recipe/${recipe.id}`}
              className="group block overflow-hidden rounded-xl bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20"
            >
              <div className="h-48 overflow-hidden">
                {recipe.illustration ? (
                  <img
                    src={recipe.illustration}
                    alt={recipe.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className={`h-full w-full flex items-center justify-center ${categoryColors[recipe.category] || 'bg-gray-100'}`}>
                    <div className="text-center p-4">
                      <UtensilsCrossed className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">{recipe.category}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 bg-white/50 backdrop-blur-sm">
                <h2 className="text-xl font-semibold mb-2 text-gray-800">{recipe.title}</h2>
                <span className="inline-block px-3 py-1 bg-white/70 backdrop-blur-sm rounded-full text-sm text-gray-700 shadow-sm">
                  {recipe.category}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {filteredRecipes.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucune recette trouvée dans cette catégorie
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipesPage; 