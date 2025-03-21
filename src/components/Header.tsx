import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  const isRecipePage = location.pathname.includes('/recipe/');
  const isRecipeListPage = location.pathname === '/recipes';
  const shouldBeLight = isRecipePage || isRecipeListPage;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3">
      <nav className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="Cookify" className="w-10 h-10" />
          <span className={`text-xl font-semibold ${shouldBeLight ? 'text-white' : 'text-gray-800'}`}>
            Cookify
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <Link 
            to="/" 
            className={`${shouldBeLight ? 'text-white hover:text-white/80' : 'text-gray-700 hover:text-gray-900'} transition-colors`}
          >
            Accueil
          </Link>
          <Link 
            to="/recipes" 
            className={`${shouldBeLight ? 'text-white hover:text-white/80' : 'text-gray-700 hover:text-gray-900'} transition-colors`}
          >
            Mes Recettes
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Header; 