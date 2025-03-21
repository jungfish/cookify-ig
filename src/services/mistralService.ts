import { Mistral } from '@mistralai/mistralai';
import OpenAI from 'openai';

const client = new Mistral({
  apiKey: import.meta.env.VITE_MISTRAL_API_KEY
});

const openai = new OpenAI({
  apiKey: "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",
  dangerouslyAllowBrowser: true
});

export async function interpretRecipe(caption: string, transcription: string): Promise<{
  title: string;
  category: "Dessert" | "Soupe" | "Plat principal" | "Entrée" | "Bébé";
  ingredients: string[];
  instructions: string[];
  prepTime: string;
  cookTime: string;
  totalTime: string;
  servings: number;
}> {
  const prompt = `
    Analyze this Instagram recipe caption and extract a structured recipe from it.
    Caption: "${caption}"
    Transcription: "${transcription}"
    Please format the response as a JSON object with these fields:
    - title: A concise recipe title
    - category: Must be one of ["Dessert", "Soupe", "Plat principal", "Entrée", "Bébé"]
    - ingredients: An array of strings, each containing one ingredient with measurement
    - instructions: An array of strings, each containing one step
    - prepTime: Time it takes to prepare the recipe
    - cookTime: Time it takes to cook the recipe
    - totalTime: Total time it takes to prepare and cook the recipe
    - servings: Number of people the recipe is for (default to 4 if not specified)
    
    Only return the JSON object, no additional text.
    language: french
  `;

  // Add logging to debug the AI response

  
  const response = await client.chat.complete({
    messages: [{ role: 'user', content: prompt }],
    model: 'mistral-tiny',
    temperature: 0.7,
  });

  try {
    const content = response.choices[0].message.content;
    console.log('Mistral response:', content); // Add this log
    const parsed = JSON.parse(typeof content === 'string' ? content : content.join(''));
    
    return {
      title: String(parsed.title),
      category: parsed.category,
      ingredients: parsed.ingredients.map(String),
      instructions: parsed.instructions.map(String),
      prepTime: parsed.prepTime,
      cookTime: parsed.cookTime,
      totalTime: parsed.totalTime,
      servings: parsed.servings || 4
    };
  } catch (error) {
    console.error('Error parsing Mistral response:', error);
    throw new Error('Failed to parse recipe from caption');
  }
}

// Add new function for image generation
export async function generateRecipeImage(title: string, ingredients: string[]): Promise<string> {
  try {
    const prompt = `A minimalistic abstract watercolor drawing of ${title}, The composition is soft and warm, inspired by recipe book illustrations. The dish is depicted in a delicate, airy watercolor style with gentle brushstrokes. The main ingredients are the following: ${ingredients.slice(0,8).join(', ')}. They are arranged artistically in a bowl or a plate, with steam subtly rising. The color palette is earthy and inviting, featuring golden tones, deep greens for vegetables and herbs, and soft browns. The background is light and textured, enhancing the organic feel. Soft natural lighting creates depth while keeping the overall aesthetic clean and modern. No text included. Composition should be wide and horizontal to fit as a banner image.`;
    
    console.log("Prompt is: ", prompt);

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",  // Changed to wider aspect ratio
      quality: "hd"
    });


    console.log('Generated image URL:', response.data[0].url);
    return response.data[0].url;
  } catch (error) {
    console.error('Error generating recipe image with DALL-E:', error);
    // Fallback to Unsplash if DALL-E fails
    return `https://source.unsplash.com/featured/?${encodeURIComponent(title)},food`;
  }
} 