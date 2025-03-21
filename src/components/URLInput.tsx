import { useState } from "react";
import { Upload, Instagram } from "lucide-react";
import { toast } from "sonner";
import { processRecipeFromInstagram } from "@/services/recipeService";
import { fetchInstagramPost } from "@/services/instagramService";

const URLInput = () => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');

  const processingSteps = {
    EXTRACT: "Extraction du texte...",
    TRANSCRIBE: "Transcription de la vidéo...",
    ANALYZE: "Analyse de la recette...",
    GENERATE: "Génération de l'illustration...",
    SAVE: "Sauvegarde de la recette..."
  };

  const handleSubmit = async (url: string) => {
    setLoading(true);
    try {
      setCurrentStep(processingSteps.EXTRACT);
      if (!url.includes("instagram.com/reel") && !url.includes("instagram.com/p/")) {
        toast.error("Please enter a valid Instagram URL");
        return;
      }
      
      const mediaData = await fetchInstagramPost(url);
      setCurrentStep(processingSteps.TRANSCRIBE);
      const { videoUrl, transcription } = mediaData;

      setCurrentStep(processingSteps.ANALYZE);
      const recipe = await processRecipeFromInstagram(
        mediaData.caption || '',
        transcription || '',
        mediaData.thumbnailUrl,
        videoUrl,
        mediaData.postUrl
      );
      
      setCurrentStep(processingSteps.SAVE);
      window.location.href = `/recipe/${recipe.id}`;
    } catch (error) {
      console.error('Error processing URL:', error);
      toast.error("Failed to process recipe");
    } finally {
      setLoading(false);
      setCurrentStep('');
    }
  };

  const handleImageUpload = async (files: FileList) => {
    setLoading(true);
    try {
      setCurrentStep(processingSteps.EXTRACT);
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData
      });
      
      const { transcription } = await response.json();
      
      setCurrentStep(processingSteps.ANALYZE);
      const recipe = await processRecipeFromInstagram('', transcription);
      
      setCurrentStep(processingSteps.SAVE);
      window.location.href = `/recipe/${recipe.id}`;
    } catch (error) {
      console.error('Error processing images:', error);
      toast.error("Failed to process images");
    } finally {
      setLoading(false);
      setCurrentStep('');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto text-center">
      <div className="mb-12">
        <img src="/logo.png" alt="Cookify" className="w-32 h-32 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Cookify</h1>
        <p className="text-xl text-gray-600">Transformez vos recettes en un instant ✨</p>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
        <div className="relative">
          <input
            type="url"
            placeholder="Collez le lien de votre recette Instagram ici..."
            onChange={(e) => e.target.value && handleSubmit(e.target.value)}
            className="w-full px-12 py-4 rounded-xl bg-white/90 border border-white/20 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
          <Instagram className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>

        <div className="mt-4 text-gray-500 font-medium">ou</div>

        <label className="mt-4 block w-full px-12 py-4 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
            disabled={loading}
          />
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Upload className="w-5 h-5" />
            <span>Importez vos photos de recette</span>
          </div>
        </label>

        {loading && (
          <div className="mt-4 flex items-center justify-center gap-3 text-gray-600">
            <div className="w-5 h-5 border-2 border-orange-300 border-t-transparent rounded-full animate-spin" />
            <span>{currentStep}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default URLInput;
