import React from "react";
import { motion } from "framer-motion";

interface Commitment {
  icon: React.ReactElement;
  title: string;
  description: string;
}

const commitments: Commitment[] = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Chất Lượng Đảm Bảo",
    description: "100% sản phẩm chính hãng, được nhập khẩu trực tiếp từ các thương hiệu uy tín trên thế giới.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Giao Hàng Nhanh Chóng",
    description: "Hệ thống vận chuyển hiện đại, đảm bảo sản phẩm đến tay khách hàng trong thời gian ngắn nhất.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: "Tư Vấn Chuyên Nghiệp",
    description: "Đội ngũ tư vấn viên giàu kinh nghiệm, sẵn sàng hỗ trợ bạn tìm được mùi hương phù hợp nhất.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    title: "Chính Sách Đổi Trả",
    description: "Cam kết đổi trả trong vòng 7 ngày nếu sản phẩm không đúng như mô tả hoặc có lỗi từ nhà sản xuất.",
  },
];

export const AboutCommitment = () => {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-light tracking-wide mb-4 text-black">
            Cam Kết Của Chúng Tôi
          </h2>
          <div className="w-24 h-1 bg-black mx-auto mb-8"></div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            SPTN Perfume cam kết mang đến cho khách hàng những trải nghiệm tốt nhất 
            với chất lượng dịch vụ và sản phẩm vượt trội
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {commitments.map((commitment, index) => (
            <motion.div
              key={commitment.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center group"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-black mb-6 mx-auto group-hover:bg-gray-200 transition-all duration-300 group-hover:scale-110">
                {commitment.icon}
              </div>
              <h3 className="text-xl font-semibold mb-4 text-black">{commitment.title}</h3>
              <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                {commitment.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

