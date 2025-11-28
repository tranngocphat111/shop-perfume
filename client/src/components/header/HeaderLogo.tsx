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
      className="transition-all duration-300 hover:opacity-80">
      <img
        src={
          isScrolled
            ? "https://res.cloudinary.com/piin/image/upload/v1763985017/logo/SPTN-BLACK.png"
            : "https://res.cloudinary.com/piin/image/upload/v1763985017/logo/SPTN-WHITE.png"
        }
        alt="LAN Perfume Logo"
        className={`transition-all duration-300 ${
          isCompact ? "h-20 md:h-22" : "h-22 md:h-24"
        }`}
      />
    </Link>
  );
};

