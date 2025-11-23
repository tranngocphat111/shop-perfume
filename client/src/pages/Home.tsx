import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useInventories } from "../hooks/usePerfumes";
import { PerfumeCard } from "../components/PerfumeCard";
import type { Inventory } from "../types";

export const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { inventories, loading } = useInventories();

  const heroSlides = [
    {
      image:
        "https://res.cloudinary.com/piin/image/upload/v1762171215/banner.zip-2_gdvc0y.jpg",
      title: "LAN Perfume",
      subtitle: "Bộ sưu tập nước hoa",
      description:
        "Nước hoa là nghệ thuật của sự chuyển biến, một bản giao hưởng mùi hương đa chiều thay đổi theo thời gian và nhiệt độ. Chúng tôi tự hào đồng hành cùng khách hàng trong hành trình khám phá những hương thơm độc đáo, phù hợp với cá tính và phong cách riêng, từ đó mang đến sự tự tin trong mọi khoảnh khắc.",
    },
    {
      image:
        "https://res.cloudinary.com/piin/image/upload/v1762171216/banner.zip-1_hdpnjf.jpg",
      title: "LAN Perfume",
      subtitle: "Bộ sưu tập nước hoa",
      description:
        "Chúng tôi tin rằng mọi thứ xuất phát từ đam mê và khát vọng cá nhân là chìa khóa dẫn đến thành công. Lan Perfume mong muốn lan tỏa nguồn năng lượng tích cực này đến với mọi người. Đặc biệt nhất chính là sự thỏa mãn đam mê về vẻ đẹp của những tầng hương.",
    },
    {
      image:
        "https://res.cloudinary.com/piin/image/upload/v1762171216/banner.zip-3_kwubol.jpg",
      title: "LAN Perfume",
      subtitle: "Bộ sưu tập nước hoa",
      description:
        'Với phương châm làm việc từ cái tâm cùng chất lượng sản phẩm tốt, Lan Perfume cam kết mang đến sự tin tưởng toàn diện cho người dùng. Mỗi mùi hương từ Lan Perfume không chỉ là một loại trang sức "vô hình", mà còn là sứ điệp chân thành và đặc biệt của từng cá nhân.',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [currentSlide]); // Reset timer khi currentSlide thay đổi

  const featuredPerfumes = inventories.slice(0, 8);
  const categories = [
    {
      name: "Woman",
      image:
        "https://lanperfume.com/wp-content/uploads/2025/11/danh-muc-nuoc-hoa-nu-Edited.jpg",
      link: "/products?gender=nu",
    },
    {
      name: "Unisex",
      image:
        "https://lanperfume.com/wp-content/uploads/2025/11/danh-muc-nuoc-hoa-unisex.jpeg",
      link: "/products?gender=unisex",
    },
    {
      name: "Man",
      image:
        "https://lanperfume.com/wp-content/uploads/2025/11/danh-muc-nuoc-hoa-nam.jpg",
      link: "/products?gender=nam",
    },
  ];

  const features = [
    {
      icon: "✓",
      title: "ĐẢM BẢO CHẤT LƯỢNG",
      description: "Sản phẩm chính hãng 100%",
    },
    { icon: "⚡", title: "HỖ TRỢ NHANH CHÓNG", description: "Tư vấn 24/7" },
    {
      icon: "💳",
      title: "THANH TOÁN TIỆN LỢI",
      description: "Đa dạng phương thức",
    },
    { icon: "🚚", title: "GIAO HÀNG NHANH", description: "Toàn quốc" },
  ];

  return (
    <div className="bg-white">
      {/* Hero Carousel */}
      <section className="relative hero-section overflow-hidden bg-black">
        {heroSlides.map((slide, index) => (
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
                  width: "40%",
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
                    className="text-sm md:text-base tracking-wider uppercase font-light"
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
                    className="text-7xl md:text-8xl lg:text-9xl whitespace-nowrap tracking-tight"
                    style={{
                      fontFamily: "system-ui, -apple-system, sans-serif",
                    }}
                  >
                    {slide.title}
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: currentSlide === index ? 0.9 : 0 }}
                    transition={{ delay: 1.4, duration: 0.8 }}
                    className="text-base md:text-lg leading-relaxed max-w-xl font-light pt-2"
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
                      className="relative inline-flex items-center gap-3 border border-white text-white px-10 py-4 text-base overflow-hidden group rounded-full"
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
                        viewBox="0 0 24 24"
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
            {heroSlides.map((_, index) => (
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
                {index < heroSlides.length - 1 && (
                  <div className="w-[2px] h-6 bg-white/20" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-center mb-16"
          >
            Bộ sưu tập nước hoa
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
              >
                <Link
                  to={category.link}
                  className="group block relative overflow-hidden aspect-[3/4]"
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-3xl font-bold mb-2">{category.name}</h3>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                      <span className="text-sm">Xem thêm</span>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Sản phẩm bán chạy
            </h2>
            <div className="w-24 h-1 bg-black mx-auto mt-6"></div>
          </motion.div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              {featuredPerfumes.map((inventory: Inventory, index: number) => (
                <motion.div
                  key={inventory.product.productId}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <PerfumeCard inventory={inventory} />
                </motion.div>
              ))}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <Link
              to="/products"
              className="inline-block bg-black text-white px-10 py-4 hover:bg-gray-800 transition-all duration-300 font-semibold"
            >
              Xem tất cả sản phẩm
            </Link>
          </motion.div>
        </div>
      </section>

      {/* About LAN Perfume */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Về LAN Perfume
              </h2>
              <div className="w-24 h-1 bg-black mb-8"></div>
              <p className="text-lg leading-relaxed text-gray-700 mb-6">
                Sứ mệnh của LAN Perfume chính là việc kiến tạo một thương hiệu
                mang đến cho khách hàng những trải nghiệm hương thơm độc đáo,
                mang đậm dấu ấn cá nhân.
              </p>
              <p className="text-lg leading-relaxed text-gray-700 mb-8">
                Để hiện thực hóa điều này, LAN Perfume xây dựng triết lý kinh
                doanh của mình trên ba trụ cột vững chắc: "𝐋uxe - 𝐀rt -
                𝐍ostalgia".
              </p>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 text-black font-semibold hover:gap-4 transition-all"
              >
                <span>Xem thêm</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative aspect-square"
            >
              <img
                src="https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800"
                alt="LAN Perfume"
                className="w-full h-full object-cover shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 px-4 bg-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Đăng Ký Nhận Tin
            </h2>
            <p className="text-lg text-gray-300 mb-10">
              Nhận thông tin về sản phẩm mới và ưu đãi đặc biệt
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Nhập email của bạn"
                className="flex-1 px-6 py-4 text-black outline-none"
              />
              <button
                type="submit"
                className="bg-white text-black px-8 py-4 font-semibold hover:bg-gray-200 transition-all"
              >
                Đăng Ký
              </button>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
