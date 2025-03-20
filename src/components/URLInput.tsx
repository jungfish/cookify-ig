import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { processRecipeFromInstagram } from "@/services/recipeService";
import { fetchInstagramPost } from "@/services/instagramService";

interface URLInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

const URLInput = ({ onSubmit, isLoading }: URLInputProps) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Check if URL contains either /reel/ or /p/ patterns from Instagram
      if (!url.includes("instagram.com/reel") && !url.includes("instagram.com/p/")) {
        toast.error("Please enter a valid Instagram URL");
        return;
      }
      
      // First get the media info
      const mediaData = await fetchInstagramPost(url);
      // Get the video URL from the response
      const { videoUrl, transcription } = mediaData;
      console.log("MEDIA DATA IS: ", mediaData);
      debugger


      // Then process the recipe with the video URL
      const recipe = await processRecipeFromInstagram(
        mediaData.caption || '',
        transcription || '',
        mediaData.thumbnailUrl,
        videoUrl,
        mediaData.postUrl
      );
      
      // Navigate to the recipe page
      window.location.href = `/recipe/${recipe.id}`;
    } catch (error) {
      console.error('Error processing URL:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="Paste your Instagram recipe URL here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 px-4 py-3 rounded-lg bg-white/90 backdrop-blur border border-white/20 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <button
            type="submit"
            disabled={loading || !url}
            className="px-6 py-3 bg-white text-gray-800 rounded-lg font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Processing..." : "Generate Recipe"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default URLInput;
