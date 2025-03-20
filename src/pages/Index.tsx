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
import { cn } from "@/lib/utils";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(-1);

  const features = [
    {
      icon: <FileText className="w-8 h-8 text-white mb-3" />,
      title: "Extract Description",
      description: "Extracts ingredients and steps from the post caption"
    },
    {
      icon: <Mic className="w-8 h-8 text-white mb-3" />,
      title: (
        <span className="flex items-center gap-2 justify-center">
          Speech to Text
        </span>
      ),
      description: (
        <div className="space-y-2">
          <p className="text-sm text-gray-300">Transcribes video audio into text</p>
          <img 
            src="/whisper-icon.svg" 
            alt="OpenAI Whisper" 
            className="h-6 mx-auto opacity-90"
          />
        </div>
      )
    },
    {
      icon: <Brain className="w-8 h-8 text-white mb-3" />,
      title: (
        <span className="flex items-center gap-2 justify-center">
          AI Processing
        </span>
      ),
      description: (
        <div className="space-y-2">
          <p className="text-sm text-gray-300">Structures recipe into clear format</p>
          <img 
            src="/mistral-icon.svg" 
            alt="Mistral AI" 
            className="h-6 mx-auto opacity-90"
          />
        </div>
      )
    },
    {
      icon: <Image className="w-8 h-8 text-white mb-3" />,
      title: (
        <span className="flex items-center gap-2 justify-center">
          Image Generation
        </span>
      ),
      description: (
        <div className="space-y-2">
          <p className="text-sm text-gray-300">Creates appetizing dish preview</p>
          <img 
            src="/dall-e-icon.svg" 
            alt="DALL·E" 
            className="h-6 mx-auto opacity-90"
          />
        </div>
      )
    }
  ];

  const handleSubmit = async (url: string) => {
    setIsLoading(true);
    setRecipe(null);
    setCurrentStep(0); // Start with first step

    try {
      // Step 1: Extract Description
      const postData = await fetchInstagramPost(url);
      if (!postData) {
        toast.error("Failed to process the Instagram content");
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Delay for animation
      setCurrentStep(1); // Move to transcription
      debugger
      // Step 2: Transcription processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      setCurrentStep(2); // Move to AI processing

      // Step 3: AI Processing
      console.log("POST DATA IS: ", postData);
      debugger;
      const generatedRecipe = await processRecipeFromInstagram(
        postData["caption"],
        postData["transcription"],
        postData["thumbnailUrl"],
        postData["videoUrl"],
        postData["postUrl"]
      );
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentStep(3); // Move to illustration

      // Step 4: Final processing and illustration
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRecipe(generatedRecipe);
      toast.success("Recipe generated successfully!");
    } catch (error) {
      console.error("Error generating recipe:", error);
      toast.error("Failed to process the recipe. Please try again.");
    } finally {
      setIsLoading(false);
      setCurrentStep(-1); // Reset steps
    }
  };

  const getFeatureStyles = (index: number) => {
    if (currentStep === -1) return "bg-white/10";
    if (currentStep === index) {
      return "bg-white/30 scale-110 shadow-2xl border-white/50 ring-2 ring-white/20";
    }
    if (currentStep > index) {
      return "bg-red-500/20 border-emerald-200/30";
    }
    return "bg-white/5 opacity-50";
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
              className={cn(
                "text-center p-6 rounded-xl backdrop-blur-sm transition-all duration-700",
                "border border-white/20",
                "transform-gpu hover:scale-105",
                getFeatureStyles(index)
              )}
            >
              <div 
                className={cn(
                  "flex justify-center mb-4 transition-all duration-500",
                  currentStep === index && "animate-pulse transform-gpu scale-110",
                  currentStep > index && "text-emerald-400"
                )}
              >
                {feature.icon}
              </div>
              <h3 className={cn(
                "text-white font-semibold mb-2 transition-colors duration-500",
                currentStep > index && "text-emerald-200"
              )}>
                {feature.title}
              </h3>
              <p className={cn(
                "text-gray-300 text-sm transition-colors duration-500",
                currentStep === index && "text-white",
                currentStep > index && "text-emerald-100"
              )}>
                {feature.description}
              </p>
              {currentStep === index && (
                <div className="mt-3 text-xs text-emerald-300 animate-pulse">
                  Processing...
                </div>
              )}
              {currentStep > index && (
                <div className="mt-3 text-xs text-emerald-400">
                  Completed ✓
                </div>
              )}
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
