import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { Recipe } from "@/types/recipe";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface RecipeCardProps {
  recipe: Recipe;
}


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
              {ingredients.map((ingredient: string, index: number) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Instructions:</h3>
            <ol className="list-decimal pl-5 space-y-1">
              {instructions.map((instruction: string, index: number) => (
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
