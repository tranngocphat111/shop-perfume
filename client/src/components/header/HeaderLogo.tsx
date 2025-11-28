import { Link, useLocation } from "react-router-dom";

interface HeaderLogoProps {
  isScrolled: boolean;
  isCompact: boolean;
}

export const HeaderLogo = ({ isScrolled, isCompact }: HeaderLogoProps) => {
  const location = useLocation();

  return (
    <Link
      to="/"
      onClick={() => {
        if (location.pathname === "/") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
      className="flex items-center transition-all duration-300 hover:opacity-80 group">
      <img
        src={
          isScrolled
            ? "https://res.cloudinary.com/piin/image/upload/v1763985017/logo/SPTN-BLACK.png"
            : "https://res.cloudinary.com/piin/image/upload/v1763985017/logo/SPTN-WHITE.png"
        }
        alt="SPTN Perfume Logo"
        className={`transition-all duration-300 flex-shrink-0 mr-[-30px] ${
          isCompact ? "h-16 md:h-18" : "h-18 md:h-20"
        }`}
      />
      <div className="flex flex-col justify-center -space-y-0.5" style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', serif" }}>
        <span
          className={`font-semibold tracking-tight transition-all duration-300 leading-none italic ${
            isCompact ? "text-base md:text-lg" : "text-lg md:text-xl"
          } ${
            isScrolled ? "text-gray-900" : "text-white"
          }`}>
          SPTN
        </span>
        <span
          className={`font-light tracking-wider transition-all duration-300 leading-none italic ${
            isCompact ? "text-[10px] md:text-xs" : "text-xs md:text-sm"
          } ${
            isScrolled ? "text-gray-500" : "text-white/70"
          }`}>
          Perfume
        </span>
      </div>
    </Link>
  );
};

