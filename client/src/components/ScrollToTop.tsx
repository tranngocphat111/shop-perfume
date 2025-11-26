import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

export const ScrollToTop = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!showScrollTop) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 w-12 h-12 bg-gray-700 text-white rounded-full shadow-lg hover:shadow-2xl transition-all flex items-center justify-center z-50 focus:outline-none focus:ring-0 focus-visible:outline-none hover:bg-gray-600"
      aria-label="Scroll to top">
      <ChevronUp className="w-6 h-6" />
    </button>
  );
};

