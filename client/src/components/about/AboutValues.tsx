import React from "react";
import { motion } from "framer-motion";

interface Value {
  letter: string;
  title: string;
  description: string;
  icon: React.ReactElement;
}

const values: Value[] = [
  {
    letter: "S",
    title: "Style",
    description: "Phong cách độc đáo, thể hiện cá tính riêng biệt của mỗi người. Mỗi mùi hương là một tuyên ngôn thầm lặng về phong cách sống.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
  },
  {
    letter: "P",
    title: "Premium",
    description: "Chất lượng cao cấp, được tuyển chọn kỹ lưỡng từ những thương hiệu nổi tiếng thế giới. Cam kết mang đến trải nghiệm xa xỉ nhất.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
  {
    letter: "T",
    title: "Timeless",
    description: "Giá trị vượt thời gian, những mùi hương kinh điển không bao giờ lỗi mốt. Mỗi sản phẩm là một khoản đầu tư lâu dài cho phong cách.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    letter: "N",
    title: "Nostalgia",
    description: "Gợi nhớ những kỷ niệm đẹp, đánh thức cảm xúc và ký ức. Mỗi mùi hương là một câu chuyện, một hành trình về quá khứ.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
];

export const AboutValues = () => {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-light tracking-wide mb-4">
            Bốn Trụ Cột Vững Chắc
          </h2>
          <div className="w-24 h-1 bg-black mx-auto mb-4"></div>
          <p className="text-gray-600 max-w-2xl mx-auto mt-6">
            Để hiện thực hóa sứ mệnh của mình, SPTN Perfume xây dựng triết lý kinh doanh 
            trên bốn trụ cột vững chắc
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, index) => (
            <motion.div
              key={value.letter}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white p-8 rounded-sm shadow-sm hover:shadow-lg transition-shadow duration-300 group"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-black text-white flex items-center justify-center text-2xl font-light group-hover:scale-110 transition-transform duration-300">
                  {value.letter}
                </div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold">{value.title}</h3>
                  <div className="text-black">
                    {value.icon}
                  </div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                {value.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

