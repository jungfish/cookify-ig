import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import axios from 'axios';
import { IgApiClient } from 'instagram-private-api';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    port: 8080,
    middlewares: {
      '/api/db': async (req, res) => {
        if (req.method === 'POST') {
          try {
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            
            req.on('end', async () => {
              try {
                const recipe = JSON.parse(body);
                console.log('Received recipe:', recipe);
                
                // Validate required fields
                if (!recipe.title || !recipe.category) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ 
                    error: 'Missing required fields: title and category are required' 
                  }));
                  return;
                }

                // Check if recipe exists by URL if provided
                let savedRecipe;
                const recipeData = {
                  title: recipe.title,
                  category: recipe.category,
                  ingredients: recipe.ingredients ? JSON.stringify(recipe.ingredients) : '[]',
                  instructions: recipe.instructions ? JSON.stringify(recipe.instructions) : '[]',
                  illustration: recipe.illustration,
                  url: recipe.url
                };

                if (recipe.url) {
                  const existingRecipe = await prisma.recipe.findFirst({
                    where: { url: recipe.url }
                  });

                  if (existingRecipe) {
                    savedRecipe = await prisma.recipe.update({
                      where: { id: existingRecipe.id },
                      data: recipeData,
                    });
                  }
                }

                if (!savedRecipe) {
                  savedRecipe = await prisma.recipe.create({
                    data: recipeData,
                  });
                }

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(savedRecipe));
              } catch (error) {
                console.error('Error saving recipe:', error);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Failed to save recipe' }));
              }
            });
          } catch (error) {
            console.error('Error processing request:', error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to process request' }));
          }
        } else if (req.method === 'PUT') {
          try {
            const body = await new Promise<string>((resolve) => {
              let data = '';
              req.on('data', chunk => { data += chunk; });
              req.on('end', () => resolve(data));
            });
            
            const recipe = JSON.parse(body);
            
            const updatedRecipe = await prisma.recipe.update({
              where: { id: recipe.id },
              data: {
                title: recipe.title,
                category: recipe.category,
                ingredients: recipe.ingredients,
                instructions: recipe.instructions,
                illustration: recipe.illustration,
                url: recipe.url,
              },
            });

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(updatedRecipe));
          } catch (error) {
            console.error('Error updating recipe:', error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to update recipe' }));
          }
        } else if (req.method === 'GET') {
          try {
            const recipes = await prisma.recipe.findMany({
              orderBy: { createdAt: 'desc' }
            });
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(recipes));
          } catch (error) {
            console.error('Database error:', error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to fetch recipes' }));
          }
        }
      },
      '/api/instagram/oembed': async (req, res) => {
        const url = new URL(req.url!, `http://${req.headers.host}`);
        const instagramUrl = url.searchParams.get('url');
        console.log('\n=== Instagram API Request ===');
        console.log('URL:', instagramUrl);
        if (!instagramUrl) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'URL parameter is required' }));
          return;
        }
        try {
          const shortcode = instagramUrl.split('/p/')[1]?.split('/')[0];
          console.log('Extracted shortcode:', shortcode);
          // Use the public oEmbed endpoint
          const apiUrl = `https://i.instagram.com/api/v1/oembed/?url=${encodeURIComponent(instagramUrl)}`;
          const response = await fetch(apiUrl, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          console.log('Response status:', response.status, "");
          const data = await response.json();
          console.log('Response data:', data);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            ...data          
          }));
        } catch (error) {
          console.error('Error:', error);
          res.statusCode = 500;
          res.end(JSON.stringify({
            error: error instanceof Error ? error.message : 'Failed to fetch from Instagram',
            details: error instanceof Error ? error.stack : undefined
          }));
        }
      },
      '/api/instagram/media': async (req, res) => {
        const url = new URL(req.url!, `http://${req.headers.host}`);

        try {
          // Use the public oEmbed endpoint
          const apiUrl = `https://social-media-video-downloader.p.rapidapi.com/smvd/get/all?url=${encodeURIComponent(url.searchParams.get('url'))}&filename=download`;
          // console.log("API URL:", apiUrl)
          const response = await fetch(apiUrl, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'X-RapidAPI-Key': '824dddee65msh76dbe040b14bfe4p12ab6ajsnc6532155d4f8',
              'X-RapidAPI-Host': 'social-media-video-downloader.p.rapidapi.com'
            }
          });
          console.log('Response status:', response.status, "");
          const data = await response.json();
          // console.log('Response data:', data);
          const [{ quality, link }] = data.links;
          // Assuming the audio URL is available in the response data
          const audioUrl = link;
          const videoUrl=data.links[1].link;
          console.log('TEST IF WE GO THROUGH THIS ENDPOINT AUDIO URL', audioUrl);
          

          let transcription = ''; // Add this line at the start of the try block

          // If there's an audio URL, handle transcription with retry logic
          if (audioUrl) {
            let retryCount = 0;
            const maxRetries = 3;
            const baseDelay = 1000;

            const openaiApiKey = process.env.OPENAI_API_KEY;
            if (openaiApiKey) {
              while (retryCount < maxRetries) {
                try {
                  // Download the audio file first
                  const audioResponse = await fetch(audioUrl);
                  const audioBuffer = await audioResponse.arrayBuffer();
                  const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });

                  // Use the browser's FormData
                  const formData = new globalThis.FormData();
                  formData.append('file', audioBlob, 'audio.mp3');
                  formData.append('model', 'whisper-1');

                  const transcriptionResponse = await axios.post(
                    'https://api.openai.com/v1/audio/transcriptions',
                    formData,
                    {
                      headers: {
                        'Authorization': `Bearer ${openaiApiKey}`,
                        'Content-Type': 'multipart/form-data',
                      },
                      maxBodyLength: Infinity,
                      timeout: 30000
                    }
                  );

                  console.log('Transcription successful');
                  transcription = transcriptionResponse.data.text;
                  break;
                } catch (error) {
                  console.error(`Transcription attempt ${retryCount + 1} failed:`, error);

                  if (axios.isAxiosError(error) && error.response?.status === 429) {
                    // Rate limit hit, wait and retry
                    const delay = baseDelay * Math.pow(2, retryCount);
                    console.log(`Rate limit hit, waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    retryCount++;

                    if (retryCount === maxRetries) {
                      console.error('Max retries reached for transcription');
                      // Continue without transcription
                      break;
                    }
                  } else {
                    // Other error, log and continue without transcription
                    console.error('Transcription error:', error);
                    break;
                  }
                }
              }
            } else {
              console.error('OpenAI API key is not configured');
            }
          }

          console.log('Checking OpenAI API key:', {
            keyExists: !!process.env.OPENAI_API_KEY,
            keyLength: process.env.OPENAI_API_KEY?.length
          });

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            ...data,
            transcription: transcription,
            videoUrl: videoUrl
          }));
        } catch (error) {
          console.error('Error processing media:', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ 
            error: error instanceof Error ? error.message : 'Failed to process media',
            details: error instanceof Error ? error.stack : undefined
          }));
        }
      },
    }
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    {
      name: 'setup-middleware',
      configureServer(server) {
        // Single recipe endpoint - using a more specific pattern
        server.middlewares.use(async (req, res, next) => {
          // Check if the URL matches our single recipe pattern
          const match = req.url?.match(/^\/api\/db\/([^\/]+)$/);
          if (match && req.method === 'GET') {
            try {
              const id = match[1];
              console.log('Looking for single recipe with ID:', id);

              const recipe = await prisma.recipe.findUnique({
                where: { id }
              });

              console.log('Found recipe:', recipe);

              if (!recipe) {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'Recipe not found' }));
                return;
              }

              // Ensure clean JSON response
              res.setHeader('Content-Type', 'application/json');
              const cleanRecipe = {
                ...recipe,
                ingredients: recipe.ingredients ? JSON.parse(recipe.ingredients) : [],
                instructions: recipe.instructions ? JSON.parse(recipe.instructions) : []
              };
              res.end(JSON.stringify(cleanRecipe));
            } catch (error) {
              console.error('Error fetching single recipe:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Server error' }));
            }
            return;
          }
          next();
        });

        // General recipes endpoint
        server.middlewares.use('/api/db', async (req, res) => {
          if (req.method === 'POST') {
            try {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });
              
              req.on('end', async () => {
                const recipe = JSON.parse(body);
                console.log('Received recipe:', recipe);
                
                // Validate required fields
                if (!recipe.title || !recipe.category) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ 
                    error: 'Missing required fields: title and category are required' 
                  }));
                  return;
                }

                try {
                  // Check if recipe with same URL exists
                  let existingRecipe = null;
                  if (recipe.url) {
                    console.log('Searching for recipe with URL:', recipe.url);
                    existingRecipe = await prisma.recipe.findFirst({
                      where: { 
                        url: recipe.url 
                      }
                    });
                    console.log('Found existing recipe:', existingRecipe);
                  }

                  let savedRecipe;
                  const recipeData = {
                    title: recipe.title,
                    category: recipe.category,
                    ingredients: recipe.ingredients ? JSON.stringify(recipe.ingredients) : '[]',
                    instructions: recipe.instructions ? JSON.stringify(recipe.instructions) : '[]',
                    illustration: recipe.illustration,
                    url: recipe.url,
                    videoUrl: recipe.videoUrl
                  };

                  if (existingRecipe && existingRecipe.id) {
                    console.log('Updating recipe with ID:', existingRecipe.id);
                    // Update existing recipe
                    savedRecipe = await prisma.recipe.update({
                      where: { 
                        id: existingRecipe.id 
                      },
                      data: recipeData,
                    });
                    console.log('Successfully updated recipe:', savedRecipe);
                  } else {
                    console.log('Creating new recipe with data:', recipeData);
                    // Create new recipe
                    savedRecipe = await prisma.recipe.create({
                      data: recipeData,
                    });
                    console.log('Successfully created recipe:', savedRecipe);
                  }
                  
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(savedRecipe));
                } catch (dbError) {
                  console.error('Database operation failed:', dbError);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ 
                    error: 'Failed to save/update recipe', 
                    details: dbError.message,
                    stack: dbError.stack 
                  }));
                }
              });
            } catch (error) {
              console.error('Error processing request:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to process request' }));
            }
          } else if (req.method === 'PUT') {
            try {
              const body = await new Promise<string>((resolve) => {
                let data = '';
                req.on('data', chunk => { data += chunk; });
                req.on('end', () => resolve(data));
              });
              
              const recipe = JSON.parse(body);
              
              const updatedRecipe = await prisma.recipe.update({
                where: { id: recipe.id },
                data: {
                  title: recipe.title,
                  category: recipe.category,
                  ingredients: recipe.ingredients,
                  instructions: recipe.instructions,
                  illustration: recipe.illustration,
                  url: recipe.url,
                },
              });

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(updatedRecipe));
            } catch (error) {
              console.error('Error updating recipe:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to update recipe' }));
            }
          } else if (req.method === 'GET') {
            try {
              const recipes = await prisma.recipe.findMany({
                orderBy: { createdAt: 'desc' }
              });
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(recipes));
            } catch (error) {
              console.error('Database error:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to fetch recipes' }));
            }
          }
        });

        server.middlewares.use('/api/instagram/oembed', async (req, res) => {
          const url = new URL(req.url!, `http://${req.headers.host}`);
          const instagramUrl = url.searchParams.get('url');
          console.log('\n=== Instagram API Request ===');
          console.log('URL:', instagramUrl);
          if (!instagramUrl) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'URL parameter is required' }));
            return;
          }
          try {
            const shortcode = instagramUrl.split('/p/')[1]?.split('/')[0];
            console.log('Extracted shortcode:', shortcode);
            // Use the public oEmbed endpoint
            const apiUrl = `https://i.instagram.com/api/v1/oembed/?url=${encodeURIComponent(instagramUrl)}`;
            const response = await fetch(apiUrl, {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
              }
            });
            console.log('Response status:', response.status, "");
            const data = await response.json();
            console.log('Response data:', data);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              ...data          
            }));
          } catch (error) {
            console.error('Error:', error);
            res.statusCode = 500;
            res.end(JSON.stringify({
              error: error instanceof Error ? error.message : 'Failed to fetch from Instagram',
              details: error instanceof Error ? error.stack : undefined
            }));
          }
        });

        // Modified media endpoint
        server.middlewares.use('/api/instagram/media', async (req, res) => {
          const url = new URL(req.url!, `http://${req.headers.host}`);

          try {
            // Use the public oEmbed endpoint
            const apiUrl = `https://social-media-video-downloader.p.rapidapi.com/smvd/get/all?url=${encodeURIComponent(url.searchParams.get('url'))}&filename=download`;
            // console.log("API URL:", apiUrl)
            const response = await fetch(apiUrl, {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'X-RapidAPI-Key': '824dddee65msh76dbe040b14bfe4p12ab6ajsnc6532155d4f8',
                'X-RapidAPI-Host': 'social-media-video-downloader.p.rapidapi.com'
              }
            });
            console.log('Response status:', response.status, "");
            const data = await response.json();
            // console.log('Response data:', data);
            const [{ quality, link }] = data.links;
            // Assuming the audio URL is available in the response data
            const audioUrl = link;
            const videoUrl=data.links[1].link;
            console.log('WE HAVE AUDIO URL', audioUrl);
            console.log('WE HAVE VIDEO URL', videoUrl);
            let transcription = ''; // Add this line at the start of the try block

            // If there's an audio URL, handle transcription with retry logic
            if (audioUrl) {
              let retryCount = 0;
              const maxRetries = 3;
              const baseDelay = 1000;

              const openaiApiKey = process.env.OPENAI_API_KEY;
              if (openaiApiKey) {
                while (retryCount < maxRetries) {
                  try {
                    // Download the audio file first
                    const audioResponse = await fetch(audioUrl);
                    const audioBuffer = await audioResponse.arrayBuffer();
                    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });

                    // Use the browser's FormData
                    const formData = new globalThis.FormData();
                    formData.append('file', audioBlob, 'audio.mp3');
                    formData.append('model', 'whisper-1');

                    const transcriptionResponse = await axios.post(
                      'https://api.openai.com/v1/audio/transcriptions',
                      formData,
                      {
                        headers: {
                          'Authorization': `Bearer ${openaiApiKey}`,
                          'Content-Type': 'multipart/form-data',
                        },
                        maxBodyLength: Infinity,
                        timeout: 30000
                      }
                    );

                    console.log('Transcription successful');
                    transcription = transcriptionResponse.data.text;
                    break;
                  } catch (error) {
                    console.error(`Transcription attempt ${retryCount + 1} failed:`, error);

                    if (axios.isAxiosError(error) && error.response?.status === 429) {
                      // Rate limit hit, wait and retry
                      const delay = baseDelay * Math.pow(2, retryCount);
                      console.log(`Rate limit hit, waiting ${delay}ms before retry...`);
                      await new Promise(resolve => setTimeout(resolve, delay));
                      retryCount++;

                      if (retryCount === maxRetries) {
                        console.error('Max retries reached for transcription');
                        // Continue without transcription
                        break;
                      }
                    } else {
                      // Other error, log and continue without transcription
                      console.error('Transcription error:', error);
                      break;
                    }
                  }
                }
              } else {
                console.error('OpenAI API key is not configured');
              }
            }

            console.log('Checking OpenAI API key:', {
              keyExists: !!process.env.OPENAI_API_KEY,
              keyLength: process.env.OPENAI_API_KEY?.length
            });

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              ...data,
              transcription: transcription,
              videoUrl: videoUrl
            }));
          } catch (error) {
            console.error('Error processing media:', error);
            res.statusCode = 500;
            res.end(JSON.stringify({ 
              error: error instanceof Error ? error.message : 'Failed to process media',
              details: error instanceof Error ? error.stack : undefined
            }));
          }
        });
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));


/* GET MEDIA WITH IG PRIVATE API 
  const url = new URL(req.url!, `http://${req.headers.host}`);
          const mediaId = url.searchParams.get('mediaId');
          let ig: IgApiClient | undefined;

          if (!mediaId) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Media ID is required' }));
            return;
          }

          console.log('\n=== MEDIA API ===');
          console.log('MEDIA ID:', mediaId);

          try {
            console.log('Initializing Instagram client...');
            ig = new IgApiClient();

            // Generate device ID before login
            console.log("USEFRNAME", "matt__jung")
            const deviceId = ig.state.generateDevice(process.env.INSTAGRAM_USERNAME!);

            console.log('Generated device ID:', deviceId);

            // Save session data
            ig.request.end$.subscribe(async () => {
              const serialized = await ig.state.serialize();
              delete serialized.constants; // This deletes the problematic field
              console.log('Session state saved');
            });

            console.log('Starting login process...');
            // Perform pre-login flow
            await ig.simulate.preLoginFlow();

            console.log('Attempting login...');
            const loggedInUser = await ig.account.login(process.env.INSTAGRAM_USERNAME!,
              process.env.INSTAGRAM_PASSWORD!
            );

            console.log('Login successful for user:', loggedInUser.username);

            console.log('Fetching media info for ID:', mediaId);

            const mediaInfo: any = await ig.media.info(mediaId);

            console.log('Media info are', mediaInfo)
            // const videoUrl: string = mediaInfo.items[0].video_versions[0].url;
            // Clean up
            await ig.simulate.postLoginFlow();


*/