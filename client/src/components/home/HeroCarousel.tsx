import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import type { HeroCarouselProps } from "../../types/home";

export const HeroCarousel = ({ slides }: HeroCarouselProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [currentSlide, slides.length]);

  return (
    <section className="relative hero-section overflow-hidden bg-black">
      {slides.map((slide, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{
            opacity: currentSlide === index ? 1 : 0,
            scale: currentSlide === index ? 1 : 1.05,
          }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0"
          style={{ pointerEvents: currentSlide === index ? "auto" : "none" }}
        >
          <div
            className="w-full h-full bg-cover bg-center relative"
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            {/* Gradient overlay từ trái qua phải */}
            <div className=" absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />

            {/* Blur overlay trượt từ trái qua phải - chỉ blur nhẹ */}
            <motion.div
              initial={{ x: "-100%", opacity: 1 }}
              animate={{
                x: currentSlide === index ? "0%" : "-100%",
                opacity: currentSlide === index ? 1 : 0,
              }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                width: "30%",
              }}
            />

            {/* Content Left Side */}
            <div className="absolute left-0 top-0 bottom-0 flex items-center px-8 md:px-12 lg:px-16 max-w-2xl z-10">
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{
                  x: currentSlide === index ? 0 : -100,
                  opacity: currentSlide === index ? 1 : 0,
                }}
                transition={{ delay: 0.6, duration: 1.2, ease: "easeOut" }}
                className="text-white space-y-4"
              >
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: currentSlide === index ? 0.8 : 0 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="text-subtitle"
                >
                  {slide.subtitle}
                </motion.p>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: currentSlide === index ? 1 : 0,
                    y: currentSlide === index ? 0 : 20,
                  }}
                  transition={{ delay: 1.1, duration: 1 }}
                  className="text-5xl md:text-7xl lg:text-8xl whitespace-nowrap tracking-tight font-normal"
                >
                  {slide.title}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: currentSlide === index ? 0.9 : 0 }}
                  transition={{ delay: 1.4, duration: 0.8 }}
                  className="text-sm md:text-base leading-relaxed max-w-2xl font-light pt-2"
                >
                  {slide.description}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: currentSlide === index ? 1 : 0,
                    y: currentSlide === index ? 0 : 20,
                  }}
                  transition={{ delay: 1.7, duration: 0.8 }}
                  className="pt-4"
                >
                  <Link
                    to="/products"
                    className="relative inline-flex items-center gap-3 border border-white text-white px-9 py-3.5 text-sm md:text-base overflow-hidden group rounded-full"
                    onMouseEnter={(e) => {
                      const overlay = e.currentTarget.querySelector(
                        ".wipe-overlay"
                      ) as HTMLElement;
                      if (overlay) {
                        overlay.style.transform = "translateX(0)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      const overlay = e.currentTarget.querySelector(
                        ".wipe-overlay"
                      ) as HTMLElement;
                      if (overlay) {
                        overlay.style.transform = "translateX(101%)";
                        setTimeout(() => {
                          overlay.style.transition = "none";
                          overlay.style.transform = "translateX(-101%)";
                          setTimeout(() => {
                            overlay.style.transition =
                              "transform 0.5s ease-out";
                          }, 50);
                        }, 500);
                      }
                    }}
                  >
                    {/* Directional Wipe: hover = trượt vào dừng, unhover = trượt tiếp ra phải */}
                    <span className="wipe-overlay absolute inset-0 bg-gray-400/90 -translate-x-full transition-transform duration-500 ease-out rounded-full"></span>

                    <span className="relative font-medium z-10 transition-colors duration-200">
                      Mua ngay
                    </span>
                    <svg
                      className="relative w-4 h-4 group-hover:translate-x-1 transition-transform duration-200 z-10"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 20"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Pagination Numbers - Vertical with Segmented Lines */}
      <div className="absolute right-6 md:right-10 lg:right-16 top-1/2 -translate-y-1/2 z-20">
        <div className="relative flex flex-col items-center">
          {slides.map((_, index) => (
            <div key={index} className="flex flex-col items-center">
              <motion.button
                onClick={() => setCurrentSlide(index)}
                className="relative flex items-center justify-center w-10 h-16 group"
                whileHover={{ scale: 1.15 }}
                transition={{ duration: 0.4 }}
              >
                <motion.span
                  className="text-white font-normal text-xl md:text-2xl relative z-10"
                  animate={{
                    scale: currentSlide === index ? 1.1 : 1,
                    opacity: currentSlide === index ? 1 : 0.4,
                    fontWeight: currentSlide === index ? 600 : 400,
                  }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  {index + 1}
                </motion.span>
              </motion.button>

              {/* Đường kẻ nối giữa các số (không hiện ở số cuối) */}
              {index < slides.length - 1 && (
                <div className="w-[2px] h-6 bg-white/20" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

