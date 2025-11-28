import { motion } from "framer-motion";

export const AboutMission = () => {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-light tracking-wide mb-4">
            Sứ Mệnh Của Chúng Tôi
          </h2>
          <div className="w-24 h-1 bg-black mx-auto mb-8"></div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-base md:text-lg text-gray-700 mb-6 leading-relaxed">
              Sứ mệnh của <strong className="font-semibold">SPTN Perfume</strong> chính là việc 
              kiến tạo một thương hiệu mang đến cho khách hàng những trải nghiệm hương thơm 
              độc đáo, mang đậm dấu ấn cá nhân.
            </p>
            <p className="text-base md:text-lg text-gray-700 mb-6 leading-relaxed">
              Chúng tôi tin rằng mỗi người đều có một phong cách riêng, một câu chuyện riêng, 
              và nước hoa chính là cách để bạn thể hiện điều đó một cách tinh tế và đầy cảm xúc.
            </p>
            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
              Với phương châm làm việc từ cái tâm cùng chất lượng sản phẩm tốt, SPTN Perfume 
              cam kết mang đến sự tin tưởng toàn diện cho người dùng. Mỗi mùi hương từ SPTN 
              Perfume không chỉ là một loại trang sức "vô hình", mà còn là sứ điệp chân thành 
              và đặc biệt của từng cá nhân.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative aspect-square"
          >
            <img
              src="https://res.cloudinary.com/piin/image/upload/v1764336437/about/about_2.jpg"
              alt="SPTN Perfume Mission"
              className="w-full h-full object-cover shadow-2xl overflow-hidden"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

