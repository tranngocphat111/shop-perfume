import {
  HeroCarousel,
  CategoriesSection,
  BestSellersSection,
  AboutSection,
} from "../components/home";
import type { HeroSlide, HomeCategory } from "../types/home";
import { usePageTitle } from "../hooks/usePageTitle";

export const Home = () => {
  usePageTitle({
    title: "STPN Perfume - Trang chủ",
    description: "Khám phá bộ sưu tập nước hoa chính hãng đa dạng với các thương hiệu cao cấp. Tìm kiếm hương thơm phù hợp với phong cách của bạn.",
    image: "https://res.cloudinary.com/piin/image/upload/v1762171215/banner.zip-2_gdvc0y.jpg"
  });

  const heroSlides: HeroSlide[] = [
    {
      image:
        "https://res.cloudinary.com/piin/image/upload/v1762171215/banner.zip-2_gdvc0y.jpg",
      title: "STPN Perfume",
      subtitle: "Bộ sưu tập nước hoa",
      description:
        "Nước hoa là nghệ thuật của sự chuyển biến, một bản giao hưởng mùi hương đa chiều thay đổi theo thời gian và nhiệt độ. Chúng tôi tự hào đồng hành cùng khách hàng trong hành trình khám phá những hương thơm độc đáo, phù hợp với cá tính và phong cách riêng, từ đó mang đến sự tự tin trong mọi khoảnh khắc.",
    },
    {
      image:
        "https://res.cloudinary.com/piin/image/upload/v1762171216/banner.zip-1_hdpnjf.jpg",
      title: "STPN Perfume",
      subtitle: "Bộ sưu tập nước hoa",
      description:
        "Chúng tôi tin rằng mọi thứ xuất phát từ đam mê và khát vọng cá nhân là chìa khóa dẫn đến thành công. Lan Perfume mong muốn lan tỏa nguồn năng lượng tích cực này đến với mọi người. Đặc biệt nhất chính là sự thỏa mãn đam mê về vẻ đẹp của những tầng hương.",
    },
    {
      image:
        "https://res.cloudinary.com/piin/image/upload/v1762171216/banner.zip-3_kwubol.jpg",
      title: "STPN Perfume",
      subtitle: "Bộ sưu tập nước hoa",
      description:
        'Với phương châm làm việc từ cái tâm cùng chất lượng sản phẩm tốt, Lan Perfume cam kết mang đến sự tin tưởng toàn diện cho người dùng. Mỗi mùi hương từ Lan Perfume không chỉ là một loại trang sức "vô hình", mà còn là sứ điệp chân thành và đặc biệt của từng cá nhân.',
    },
  ];

  const categories: HomeCategory[] = [
    {
      name: "Nữ",
      image:
        "https://lanperfume.com/wp-content/uploads/2025/11/danh-muc-nuoc-hoa-nu-Edited.jpg",
      link: "/products?categoryId=1",
    },
    {
      name: "Unisex",
      image:
        "https://lanperfume.com/wp-content/uploads/2025/11/danh-muc-nuoc-hoa-unisex.jpeg",
      link: "/products?categoryId=3",
    },
    {
      name: "Nam",
      image:
        "https://lanperfume.com/wp-content/uploads/2025/11/danh-muc-nuoc-hoa-nam.jpg",
      link: "/products?categoryId=2",
    },
  ];

  return (
    <div className="bg-white">
      <HeroCarousel slides={heroSlides} />
      <CategoriesSection categories={categories} />
      <BestSellersSection />
      <AboutSection />
    </div>
  );
};
