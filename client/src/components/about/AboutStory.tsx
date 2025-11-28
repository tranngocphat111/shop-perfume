import { motion } from "framer-motion";

export const AboutStory = () => {
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
            Câu Chuyện Của Chúng Tôi
          </h2>
          <div className="w-24 h-1 bg-black mx-auto mb-8"></div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative aspect-square order-2 md:order-1"
          >
            <img
              src="https://res.cloudinary.com/piin/image/upload/v1764336437/about/about_1.jpg"
              alt="SPTN Perfume Story"
              className="w-full h-full object-cover shadow-2xl overflow-hidden"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="order-1 md:order-2"
          >
            <p className="text-base md:text-lg text-gray-700 mb-6 leading-relaxed">
              Nước hoa là nghệ thuật của sự chuyển biến, một bản giao hưởng mùi hương đa chiều 
              thay đổi theo thời gian và nhiệt độ. Chúng tôi tự hào đồng hành cùng khách hàng 
              trong hành trình khám phá những hương thơm độc đáo, phù hợp với cá tính và phong 
              cách riêng, từ đó mang đến sự tự tin trong mọi khoảnh khắc.
            </p>
            <p className="text-base md:text-lg text-gray-700 mb-6 leading-relaxed">
              Chúng tôi tin rằng mọi thứ xuất phát từ đam mê và khát vọng cá nhân là chìa khóa 
              dẫn đến thành công. SPTN Perfume mong muốn lan tỏa nguồn năng lượng tích cực này 
              đến với mọi người. Đặc biệt nhất chính là sự thỏa mãn đam mê về vẻ đẹp của những 
              tầng hương.
            </p>
            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
              Từ những ngày đầu thành lập, chúng tôi đã luôn đặt khách hàng làm trung tâm, 
              không ngừng tìm kiếm và mang về những sản phẩm chất lượng nhất, phục vụ cho 
              nhu cầu đa dạng của mọi người yêu thích nước hoa.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

