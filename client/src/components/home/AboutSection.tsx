import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export const AboutSection = () => {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-section-title mb-6">
              Về SPTN Perfume
            </h2>
            <div className="w-24 h-1 bg-black mb-8"></div>
            <p className="text-base text-gray-700 mb-6">
              Sứ mệnh của SPTN Perfume chính là việc kiến tạo một thương hiệu
              mang đến cho khách hàng những trải nghiệm hương thơm độc đáo,
              mang đậm dấu ấn cá nhân.
            </p>
            <p className="text-base text-gray-700 mb-8">
              Để hiện thực hóa điều này, SPTN Perfume xây dựng triết lý kinh
              doanh của mình trên bốn trụ cột vững chắc: "𝐒tyle - 𝐏remium -
              𝐓imeless - 𝐍ostalgia".
            </p>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 text-black font-semibold text-sm md:text-base hover:gap-4 transition-all"
            >
              <span>Xem thêm</span>
              <svg
                className="w-5 h-5"
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

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative aspect-square"
          >
            <img
              src="https://res.cloudinary.com/piin/image/upload/about/about_3.jpg"
              alt="SPTN Perfume"
              className="w-full h-full object-cover shadow-md  overflow-hidden"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

