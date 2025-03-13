import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-white shadow-sm">
      <nav className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="text-xl font-semibold text-gray-800 hover:text-gray-600"
          >
            Recipe Generator
          </Link>
          <div className="flex gap-4">
            <Link 
              to="/" 
              className="text-gray-600 hover:text-gray-800"
            >
              New Recipe
            </Link>
            <Link 
              to="/recipes" 
              className="text-gray-600 hover:text-gray-800"
            >
              All Recipes
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header; 