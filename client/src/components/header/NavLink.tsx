import { Link } from "react-router-dom";

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  isScrolled: boolean;
  isCompact?: boolean;
}

export const NavLink = ({
  to,
  children,
  isScrolled,
  isCompact = false,
}: NavLinkProps) => (
  <Link
    to={to}
    className={`font-normal transition-all duration-300 relative group ${
      isCompact ? "text-sm" : "text-base"
    } ${
      isScrolled
        ? "text-gray-700 hover:text-black"
        : "text-white hover:text-gray-200"
    }`}>
    {children}
    <span
      className={`absolute -bottom-1 left-0 w-0 h-0.5 transition-all group-hover:w-full ${
        isScrolled ? "bg-black" : "bg-white"
      }`}></span>
  </Link>
);

