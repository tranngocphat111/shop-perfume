import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Pagination, Mousewheel } from 'swiper/modules';

// Import Swiper styles
// @ts-ignore
import 'swiper/css';
// @ts-ignore
import 'swiper/css/free-mode';
// @ts-ignore
import 'swiper/css/pagination';

import { useBestSellers } from "../../hooks/useBestSellers";
import { PerfumeCard } from "../PerfumeCard";

export const BestSellersSection = () => {
  const { bestSellers, loading } = useBestSellers();

  // Limit to 8 products for best sellers
  const products = bestSellers.slice(0, 8);

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden select-none">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-black rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-black rounded-full blur-3xl" />
      </div>

      <div className="max-w-[1800px] mx-auto px-4 md:px-8 relative z-10">
        {/* Section Header */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-section-title text-center mb-16"
        >
          Sản phẩm bán chạy
        </motion.h2>

        {loading ? (
          <div className="flex justify-center items-center py-32">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
              <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-32">
            <p className="text-gray-500 text-lg">Không có sản phẩm nào</p>
          </div>
        ) : (
          <div className="relative overflow-hidden px-4 md:px-8">
            <div className="best-sellers-container mx-auto">
              <Swiper
                modules={[FreeMode, Pagination, Mousewheel]}
                slidesPerView="auto"
                freeMode={{
                  enabled: true,
                  momentum: true,
                  momentumRatio: 0.3,
                  momentumVelocityRatio: 0.3,
                  sticky: true,
                }}
                mousewheel={{
                  forceToAxis: true,
                  sensitivity: 0.5,
                }}
                speed={600}
                resistance={true}
                resistanceRatio={0.85}
                grabCursor={true}
                pagination={{
                  clickable: true,
                  dynamicBullets: false,
                }}
                className="best-sellers-swiper"
                breakpoints={{
                  0: {
                    spaceBetween: 16,
                  },
                  480: {
                    spaceBetween: 16,
                  },
                  768: {
                    spaceBetween: 20,
                  },
                  1024: {
                    spaceBetween: 24,
                  },
                  1280: {
                    spaceBetween: 24,
                  },
                }}
              >
              {products.map((inventory, index) => (
                <SwiperSlide key={inventory.product.productId}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ 
                      duration: 0.5,
                      delay: index * 0.08,
                      ease: [0.22, 1, 0.36, 1]
                    }}
                  >
                    <PerfumeCard inventory={inventory} />
                  </motion.div>
                </SwiperSlide>
              ))}
              </Swiper>

            </div>
          </div>
        )}
      </div>
    </section>
  );
};
