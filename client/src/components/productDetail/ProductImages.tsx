import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import type { Product } from "../../types";
import { getPrimaryImageUrl, getImageUrls } from "../../utils/helpers";

interface ProductImagesProps {
  product: Product;
}

export const ProductImages = ({ product }: ProductImagesProps) => {
  const images = getImageUrls(product);
  const primaryImage = getPrimaryImageUrl(product);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && images.length > 0) {
      setSelectedImageIndex((prev) => (prev + 1) % images.length);
    }
    if (isRightSwipe && images.length > 0) {
      setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col gap-4">
      {/* Main Image - Swipeable */}
      <div
        className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm cursor-grab active:cursor-grabbing"
        style={{ maxHeight: "400px" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}>
        <img
          src={images[selectedImageIndex] || primaryImage}
          alt={product.name}
          className="w-full h-auto object-contain max-h-[400px] mx-auto p-4 select-none"
          draggable={false}
          onError={(e) => {
            e.currentTarget.src =
              "https://via.placeholder.com/600x600/f0f0f0/333333?text=No+Image";
          }}
        />
        {images.length > 1 && (
          <>
            <button
              onClick={() =>
                setSelectedImageIndex(
                  (prev) => (prev - 1 + images.length) % images.length
                )
              }
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all"
              aria-label="Previous image">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() =>
                setSelectedImageIndex((prev) => (prev + 1) % images.length)
              }
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all"
              aria-label="Next image">
              <ChevronLeft className="w-5 h-5 rotate-180" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Images */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setSelectedImageIndex(index)}
              className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                selectedImageIndex === index
                  ? "border-black shadow-sm"
                  : "border-gray-200 hover:border-gray-400"
              }`}>
              <img
                src={img}
                alt={`${product.name} ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
};

