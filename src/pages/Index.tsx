import { useState } from "react";
import URLInput from "@/components/URLInput";
import RecipeCard from "@/components/RecipeCard";
import type { Recipe } from "@/types/recipe";
import { toast } from "sonner";
import { fetchInstagramPost } from "@/services/instagramService";
import { processRecipeFromInstagram } from "@/services/recipeService";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, Mic, Brain, Image } from "lucide-react";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  const features = [
    {
      icon: <FileText className="w-8 h-8 text-white mb-3" />,
      title: "Extract Description",
      description: "Captures recipe details from post captions"
    },
    {
      icon: <Mic className="w-8 h-8 text-white mb-3" />,
      title: "Video Transcription",
      description: "Converts video instructions into text"
    },
    {
      icon: <Brain className="w-8 h-8 text-white mb-3" />,
      title: "AI Processing",
      description: "Synthesizes information into recipe format"
    },
    {
      icon: <Image className="w-8 h-8 text-white mb-3" />,
      title: "Generate Illustration",
      description: "Creates visual representation of the dish"
    }
  ];

  const handleSubmit = async (url: string) => {
    setIsLoading(true);
    try {
      // Fetch Instagram post data
      const postData = await fetchInstagramPost(url);
      
      if (!postData) {
        toast.error("Failed to process the Instagram content");
        setIsLoading(false);
        return;
      }
      
      console.log("Post data is: ", postData);
      // Process the caption into a recipe
      const generatedRecipe = await processRecipeFromInstagram(postData["caption"], postData["transcription"], postData["thumbnailUrl"]);
      
      setRecipe(generatedRecipe);
      toast.success("Recipe generated successfully!");
    } catch (error) {
      console.error("Error generating recipe:", error);
      toast.error("Failed to process the recipe. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[600px] flex items-center justify-center">
      {/* Hero Background */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1543353071-873f17a7a088?q=80&w=2070")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Transform Your Instagram Recipes
          </h1>
          <p className="text-xl text-gray-200 mb-12">
            Turn your favorite cooking videos into detailed, easy-to-follow recipes
          </p>
          
          <URLInput onSubmit={handleSubmit} isLoading={isLoading} />
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="text-center p-4 rounded-lg bg-white/10 backdrop-blur-sm"
            >
              <div className="flex justify-center">
                {feature.icon}
              </div>
              <h3 className="text-white font-semibold mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-300 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {isLoading && (
          <div className="w-full max-w-2xl mx-auto h-96 rounded-lg loading-shimmer mt-8" />
        )}

        {recipe && <RecipeCard recipe={recipe} />}
      </div>
    </div>
  );
};

export default Index;
