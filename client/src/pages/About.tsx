import { useState, useEffect } from "react";
import {
  AboutHero,
  AboutMission,
  AboutValues,
  AboutStory,
  AboutCommitment,
} from "../components/about";
import { usePageTitle } from "../hooks/usePageTitle";

export const About = () => {
  const [isLoading, setIsLoading] = useState(true);

  usePageTitle({
    title: "Về chúng tôi - STPN Perfume",
    description: "Tìm hiểu về STPN Perfume - Cửa hàng nước hoa chính hãng với cam kết chất lượng và dịch vụ tốt nhất.",
    image: "https://res.cloudinary.com/piin/image/upload/v1762171215/banner.zip-2_gdvc0y.jpg"
  });

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    // Simulate loading time to show loading animation
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Scroll to top after loading completes
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 800); // Show loading for 800ms to let animations prepare

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="bg-white p-8 flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 text-lg">Đang tải trang giới thiệu...</p>
          <p className="text-gray-400 text-sm mt-2">Vui lòng đợi trong giây lát</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <AboutHero />
      <AboutMission />
      <AboutValues />
      <AboutStory />
      <AboutCommitment />
    </div>
  );
};

