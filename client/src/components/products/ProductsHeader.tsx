import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface ProductsHeaderProps {
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
  filterKey?: string; // Key to trigger animation when filters change
  isLoading?: boolean; // Whether data is loading
}

export const ProductsHeader = ({
  title = "Danh mục",
  breadcrumbs = [
    { label: "Trang chủ", path: "/" },
    { label: "Danh mục" },
  ],
  filterKey = "",
  isLoading = false,
}: ProductsHeaderProps) => {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Check if scrolled to top and not loading
  useEffect(() => {
    if (!isLoading) {
      const checkScroll = () => {
        if (window.scrollY <= 100) {
          setShouldAnimate(true);
        }
      };
      
      // Check immediately
      checkScroll();
      
      // Also listen for scroll events
      window.addEventListener('scroll', checkScroll);
      return () => window.removeEventListener('scroll', checkScroll);
    } else {
      setShouldAnimate(false);
    }
  }, [isLoading, filterKey]);

  return (
    <motion.div
      key={filterKey}
      className="bg-white rounded-lg shadow-sm py-16 px-6 mb-6"
      initial={{ opacity: 0, y: -30 }}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: -30 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="text-center">
        <motion.h1
          className="capitalize text-3.5xl md:text-4.5xl lg:text-5.5xl font-normal text-black mb-8 leading-tight tracking-tight"
          initial={{ opacity: 0, y: -20 }}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        >
          {title}
        </motion.h1>
        <motion.nav
          className="text-sm md:text-base flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={shouldAnimate ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {breadcrumbs.map((item, index) => (
            <motion.div
              key={index}
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={shouldAnimate ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
            >
              {item.path ? (
                <Link
                  to={item.path}
                  className="text-gray-600 font-normal hover:text-black transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-black font-medium  text-base md:text-lg">{item.label}</span>
              )}
              {index < breadcrumbs.length - 1 && (
                <span className="text-black">{'>'}</span>
              )}
            </motion.div>
          ))}
        </motion.nav>
      </div>
    </motion.div>
  );
};

