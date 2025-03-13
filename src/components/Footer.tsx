import { Heart, Github } from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full py-6 px-4 border-t bg-white/50 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-center gap-2 text-sm text-gray-600">
        <span>Made with</span>
        <Heart className="w-4 h-4 text-red-500 animate-pulse" />
        <span>by Matthieu Jungfer</span>
        <a 
          href="https://github.com/jungfish/cookify-reel-scribe"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900 transition-colors ml-2"
        >
          <Github className="w-4 h-4" />
          <span>GitHub</span>
        </a>
      </div>
    </footer>
  );
};

export default Footer; 