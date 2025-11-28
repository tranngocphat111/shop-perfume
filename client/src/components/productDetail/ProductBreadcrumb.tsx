import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Product } from "../../types";

interface ProductBreadcrumbProps {
  product: Product;
}

export const ProductBreadcrumb = ({ product }: ProductBreadcrumbProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.3 }}
      className="py-3 md:py-4">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <nav className="text-xs md:text-sm flex items-center gap-2">
          <Link
            to="/"
            className="text-gray-500 font-normal hover:text-black transition-colors">
            Trang chủ
          </Link>
          <span className="text-gray-400">/</span>
          <Link
            to="/products"
            className="text-gray-500 font-normal hover:text-black transition-colors">
            {product.category.name}
          </Link>
          <span className="text-gray-400">/</span>
          <Link
            to={`/products?brandId=${product.brand.brandId}`}
            className="text-gray-500 font-normal hover:text-black transition-colors">
            {product.brand.name}
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-black font-medium text-base md:text-lg line-clamp-1">
            {product.name}
          </span>
        </nav>
      </div>
    </motion.div>
  );
};

