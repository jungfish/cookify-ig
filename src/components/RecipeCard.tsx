import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UtensilsCrossed } from "lucide-react";
import type { Recipe } from "@/types/recipe";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface RecipeCardProps {
  recipe: Recipe;
}

const categoryColors = {
  Dessert: "bg-pink-100 text-pink-800",
  Soupe: "bg-amber-100 text-amber-800",
  "Plat principal": "bg-emerald-100 text-emerald-800",
  Entrée: "bg-blue-100 text-blue-800",
  Bébé: "bg-purple-100 text-purple-800",
};

const RecipeCard = ({ recipe }: RecipeCardProps) => {
  const ingredients = Array.isArray(recipe.ingredients) 
    ? recipe.ingredients 
    : JSON.parse(typeof recipe.ingredients === 'string' ? recipe.ingredients : '[]');
    
  const instructions = Array.isArray(recipe.instructions)
    ? recipe.instructions
    : JSON.parse(typeof recipe.instructions === 'string' ? recipe.instructions : '[]');

  return (
    <Card className="w-full max-w-2xl mx-auto glass-card recipe-card overflow-hidden">
      {recipe.videoUrl ? (
        <AspectRatio ratio={9/16} className="bg-black">
          <video 
            src={recipe.videoUrl}
            controls
            className="w-full h-full object-contain"
            playsInline
            preload="metadata"
          />
        </AspectRatio>
      ) : recipe.illustration && (
        <div className="h-64 overflow-hidden">
          <img
            src={recipe.illustration}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle>{recipe.title}</CardTitle>
        <CardDescription>{recipe.category}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Ingredients:</h3>
            <ul className="list-disc pl-5 space-y-1">
              {ingredients.map((ingredient, index) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Instructions:</h3>
            <ol className="list-decimal pl-5 space-y-1">
              {instructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecipeCard;
