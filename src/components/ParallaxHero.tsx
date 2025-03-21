import { useEffect, useState } from 'react';

interface ParallaxHeroProps {
  imageUrl: string;
  title: string;
  children?: React.ReactNode;
  height?: string;
  overlay?: boolean;
}

const ParallaxHero = ({ 
  imageUrl, 
  title, 
  children, 
  height = "h-[300px]",
  overlay = true 
}: ParallaxHeroProps) => {
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`relative w-full ${height} mb-16 overflow-hidden`}>
      <div className="absolute inset-0 w-full h-[120%] -top-10">
        <div
          className="mx-auto max-w-7xl h-full"
          style={{
            backgroundImage: `url("${imageUrl}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `translateY(${scrollPosition * 0.5}px)`,
            willChange: 'transform'
          }}
        />
      </div>
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      )}
      <div className="relative z-10 h-full flex flex-col justify-end items-center pb-12">
        <div className="bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/20">
          <h1 className="text-4xl font-bold text-white text-center w-full max-w-4xl">
            {title}
          </h1>
        </div>
        {children}
      </div>
    </div>
  );
};

export default ParallaxHero; 