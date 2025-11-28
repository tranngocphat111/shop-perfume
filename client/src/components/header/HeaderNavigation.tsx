import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { NavLink } from "./NavLink";
import { CategoriesDropdown } from "./CategoriesDropdown";
import { BrandsDropdown } from "./BrandsDropdown";

interface Category {
  categoryId: number;
  name: string;
}

interface Brand {
  brandId: number;
  name: string;
}

interface HeaderNavigationProps {
  categories: Category[];
  allBrands: Brand[];
  groupedBrands: Record<string, Brand[]>;
  availableLetters: string[];
  brandsLoading: boolean;
  openDropdown: string | null;
  setOpenDropdown: (value: string | null) => void;
  showSearch: boolean;
  isScrolled: boolean;
  isCompact: boolean;
}

export const HeaderNavigation = ({
  categories,
  allBrands,
  groupedBrands,
  availableLetters,
  brandsLoading,
  openDropdown,
  setOpenDropdown,
  showSearch,
  isScrolled,
  isCompact,
}: HeaderNavigationProps) => {
  const location = useLocation();

  return (
    <motion.nav
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8
      }}
      className="hidden lg:flex items-center space-x-6">
          <Link
            to="/"
            onClick={() => {
              if (location.pathname === "/") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className={`font-normal transition-all duration-300 relative group text-sm md:text-base ${
              isScrolled
                ? "text-gray-700 hover:text-black"
                : "text-white hover:text-gray-200"
            }`}>
            Trang chủ
            <span
              className={`absolute -bottom-1 left-0 w-0 h-0.5 transition-all group-hover:w-full ${
                isScrolled ? "bg-black" : "bg-white"
              }`}></span>
          </Link>
          <NavLink to="/about" isScrolled={isScrolled} isCompact={isCompact}>
            Giới thiệu
          </NavLink>

          <CategoriesDropdown
            categories={categories}
            isOpen={openDropdown === "products"}
            onMouseEnter={() => setOpenDropdown("products")}
            onMouseLeave={() => setOpenDropdown(null)}
            isScrolled={isScrolled}
            isCompact={isCompact}
          />

          <BrandsDropdown
            allBrands={allBrands}
            groupedBrands={groupedBrands}
            availableLetters={availableLetters}
            loading={brandsLoading}
            isOpen={openDropdown === "brands"}
            onMouseEnter={() => setOpenDropdown("brands")}
            onMouseLeave={() => setOpenDropdown(null)}
            isScrolled={isScrolled}
            isCompact={isCompact}
          />

          <NavLink
            to="/contact"
            isScrolled={isScrolled}
            isCompact={isCompact}>
            Liên hệ
          </NavLink>
        </motion.nav>
  );
};

