import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip protection for static assets and API routes
  if (req.url?.startsWith('/api/') ||
      req.url?.endsWith('.js') ||
      req.url?.endsWith('.css') ||
      req.url?.endsWith('.ico')) {
    return next();
  }

  // Check for auth cookie
  const isAuthenticated = req.cookies?.auth === 'true';
  const isLoginPage = req.url === '/login';

  // Handle login page
  if (isLoginPage) {
    if (isAuthenticated) {
      res.redirect('/');
      return;
    }

    if (req.method === 'POST') {
      const password = req.body.password;
      
      if (password === process.env.AUTH_PASSWORD) {
        res.cookie('auth', 'true', { httpOnly: true });
        res.redirect('/');
        return;
      }
      
      res.redirect('/login');
      return;
    }

    // Serve login page HTML
    res.send(`
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
    res.redirect('/login');
    return;
  }

  next();
}; 