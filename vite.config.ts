import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import axios from 'axios';
import { IgApiClient } from 'instagram-private-api';
import { PrismaClient } from '@prisma/client';
import formidable from 'formidable';
import fs from 'fs';

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
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    {
      name: 'setup-middleware',
      configureServer(server) {
        // Password protection middleware
        server.middlewares.use((req, res, next) => {
          // Skip protection for static assets and API routes
          if (req.url?.startsWith('/@') || 
              req.url?.startsWith('/node_modules/') ||
              req.url?.startsWith('/api/') ||
              req.url?.endsWith('.js') ||
              req.url?.endsWith('.css') ||
              req.url?.endsWith('.ico')) {
            return next();
          }

          // Check for auth cookie
          const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = value;
            return acc;
          }, {} as Record<string, string>) || {};

          const isAuthenticated = cookies['auth'] === 'true';
          const isLoginPage = req.url === '/login';

          // Handle login page
          if (isLoginPage) {
            if (isAuthenticated) {
              res.writeHead(302, { Location: '/' });
              return res.end();
            }

            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });
              
              req.on('end', () => {
                const formData = new URLSearchParams(body);
                const password = formData.get('password');
                
                if (password === 'pouet') {
                  res.writeHead(302, {
                    'Set-Cookie': 'auth=true; HttpOnly; Path=/',
                    'Location': '/'
                  });
                  return res.end();
                }
                
                res.writeHead(302, { Location: '/login' });
                return res.end();
              });
              return;
            }

            // Serve login page HTML
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <!DOCTYPE html>
              <html lang="en">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Cookify - Login</title>
                  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                  <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                    body {
                      font-family: 'Inter', sans-serif;
                      background-color: #f3f4f6;
                      min-height: 100vh;
                    }
                    .gradient-text {
                      background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
                      -webkit-background-clip: text;
                      -webkit-text-fill-color: transparent;
                    }
                    .gradient-border {
                      position: relative;
                      border: double 2px transparent;
                      border-radius: 0.75rem;
                      background-image: linear-gradient(white, white), 
                                      linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
                      background-origin: border-box;
                      background-clip: padding-box, border-box;
                    }
                    .gradient-button {
                      background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
                      transition: all 0.3s ease;
                    }
                    .gradient-button:hover {
                      transform: translateY(-2px);
                      box-shadow: 0 10px 20px -10px rgba(255, 107, 107, 0.5);
                    }
                  </style>
                </head>
                <body class="flex items-center justify-center p-4">
                  <div class="gradient-border bg-white p-8 w-full max-w-md">
                    <div class="text-center mb-8">
                      <h1 class="text-4xl font-bold mb-2">
                        <span class="gradient-text">Cookify</span>
                      </h1>
                      <p class="text-gray-600">Enter password to access your recipes</p>
                    </div>
                    
                    <form method="POST" action="/login" class="space-y-6">
                      <div>
                        <div class="relative">
                          <input
                            type="password"
                            name="password"
                            required
                            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all"
                            placeholder="Enter password"
                          />
                        </div>
                      </div>
                      
                      <button
                        type="submit"
                        class="gradient-button w-full py-3 px-4 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400"
                      >
                        Enter
                      </button>
                    </form>
                  </div>
                </body>
              </html>
            `);
            return;
          }

          if (!isAuthenticated) {
            res.writeHead(302, { Location: '/login' });
            return res.end();
          }

          next();
        });

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
                    videoUrl: recipe.videoUrl,
                    prepTime: recipe.prepTime,
                    cookTime: recipe.cookTime,
                    totalTime: recipe.totalTime,
                    servings: recipe.servings
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
            // Use the public oEmbed endpoint
            const apiUrl = `https://i.instagram.com/api/v1/oembed/?url=${encodeURIComponent(instagramUrl)}`;
            const response = await fetch(apiUrl, {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
              }
            });
            const data = await response.json();
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

        // Get video media from Social Media Video Downloader API
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
            console.log('Response data:', data);
            const [{ quality, link }] = data.links;
            // Assuming the audio URL is available in the response data
            const audioUrl = link;
            const videoUrl=data.links[1].link;
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

        // Get video media from Instagram Private API
        server.middlewares.use('/api/instagram-private/media', async (req, res) => {
          const url = new URL(req.url!, `http://${req.headers.host}`);

          try {
            console.log('\n=== INSTAGRAM PRIVATE API ===');
            const mediaId = url.searchParams.get('mediaId');
            let videoUrl: string = "";
            let ig: IgApiClient | undefined;
  
            if (!mediaId) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Media ID is required' }));
              return;
            }
  
            try {
              console.log('Initializing Instagram client...');
              ig = new IgApiClient();
  
              // Generate device ID before login
              const deviceId = ig.state.generateDevice(process.env.INSTAGRAM_USERNAME!);
  
              console.log('Generated device ID:', deviceId);
  
              // Save session data
              ig.request.end$.subscribe(async () => {
                const serialized = await ig.state.serialize();
                delete serialized.constants; // This deletes the problematic field
                console.log('Session state saved');
              });
  
              await ig.simulate.preLoginFlow();
              const loggedInUser = await ig.account.login(process.env.INSTAGRAM_USERNAME!,
                process.env.INSTAGRAM_PASSWORD!
              );
  
              console.log('Login successful for user:', loggedInUser.username);
  
              console.log('Fetching media info for ID:', mediaId);
  
              const mediaInfo: any = await ig.media.info(mediaId);
              videoUrl = mediaInfo.items[0].video_versions[0].url;

            } catch (error) {
              console.error('Error with Instagram API:', error);
              throw error;
            }
            
            // Assuming the audio URL is available in the response data
            const audioUrl = "";
            const data = {
              videoUrl: videoUrl,
              audioUrl: audioUrl
            }

            let transcription = ''; // Add this line at the start of the try block

            // If there's a video URL, handle transcription with retry logic
            if (videoUrl) {
              const response = await fetch(`http://localhost:8080/api/ai/transcribe?videoUrl=${encodeURIComponent(videoUrl)}`);
              const data = await response.json();
              transcription = data.transcription;
            }

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
        // Get video media from Instagram Private API
        server.middlewares.use('/api/ai/transcribe', async (req, res) => {
          const url = new URL(req.url!, `http://${req.headers.host}`);

          try {
            console.log('\n=== OPENAI TRANSCRIBE ===');
            const videoUrl = url.searchParams.get('videoUrl');
            let ig: IgApiClient | undefined;
  
            if (!videoUrl) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Video URL is required' }));
              return;
            }
            
            // Assuming the audio URL is available in the response data
            const audioUrl = "";
            const data = {
              videoUrl: videoUrl,
              audioUrl: audioUrl
            }

            let transcription = ''; // Add this line at the start of the try block

            // If there's an video URL, handle transcription with retry logic
            if (videoUrl) {
              let retryCount = 0;
              const maxRetries = 3;
              const baseDelay = 1000;

              const openaiApiKey = process.env.OPENAI_API_KEY;
              if (openaiApiKey) {
                while (retryCount < maxRetries) {
                  try {
                    // Download the audio file first
                    const audioResponse = await fetch(videoUrl);
                    const audioBuffer = await audioResponse.arrayBuffer();
                    const audioBlob = new Blob([audioBuffer], { type: 'video/mp4' });

                    // Use the browser's FormData
                    const formData = new globalThis.FormData();
                    formData.append('file', audioBlob, 'video.mp4');  
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


            res.end(JSON.stringify({
              transcription: transcription
            }));
          } catch (error) {
            console.error('Error transcribing media:', error);
            res.statusCode = 500;
            res.end(JSON.stringify({ 
              error: error instanceof Error ? error.message : 'Failed to transcribe',
              details: error instanceof Error ? error.stack : undefined
            }));
          }
        });

        // Get PHOTOS 
        server.middlewares.use('/api/ocr', async (req, res) => {
          if (req.method === 'POST') {
            console.log('\n=== OPENAI VISION ===');
            try {
              const form = formidable({ multiples: true });
              
              form.parse(req, async (err, fields, files) => {
                if (err) {
                  console.error('Form parsing error:', err);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'Failed to parse form data' }));
                  return;
                }

                const fileArray = Array.isArray(files.images) ? files.images : [files.images];
                
                // Prepare content array for all images
                const content = [
                  {
                    type: "text",
                    text: "Extract and list all text from these recipe images, preserving the original text."
                  }
                ];

                // Add each image to the content array
                for (const file of fileArray) {
                  const fileBuffer = await fs.promises.readFile(file.filepath);
                  const base64Image = fileBuffer.toString('base64');
                  content.push({
                    type: "image_url",
                    image_url: {
                      url: `data:${file.mimetype};base64,${base64Image}`
                    }
                  });
                }

                // Single API call with all images
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [{
                      role: "user",
                      content: content
                    }],
                    max_tokens: 500
                  })
                });

                const data = await response.json();
                console.log('DATA', data.choices);

                if (!data.choices || !data.choices[0]?.message?.content) {
                  console.error('Unexpected API response format:', data);
                  if (data.error) {
                    console.error('API Error:', data.error);
                  }
                  throw new Error('Invalid response from OpenAI API');
                }

                res.setHeader('Content-Type', 'application/json');
                console.log('FULL TEXT', data.choices[0].message.content);
                res.end(JSON.stringify({ transcription: data.choices[0].message.content }));
              });
            } catch (error) {
              console.error('OCR error:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to process images' }));
            }
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

async function parseMultipartFormData(req: any): Promise<FormData> {
  const form = formidable({ multiples: true });
  
  return new Promise((resolve, reject) => {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      
      const formData = new FormData();
      
      // Handle files
      if (files.images) {
        const fileArray = Array.isArray(files.images) ? files.images : [files.images];
        for (const file of fileArray) {
          const fileBuffer = await fs.promises.readFile(file.filepath);
          const blob = new Blob([fileBuffer], { type: file.mimetype });
          formData.append('images', blob, file.originalFilename);
        }
      }
      
      resolve(formData);
    });
  });
}