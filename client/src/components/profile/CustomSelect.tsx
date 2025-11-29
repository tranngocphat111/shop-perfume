import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ code: string | number; name: string }>;
  placeholder: string;
  icon: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
}

export const CustomSelect = ({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  icon, 
  disabled, 
  loading 
}: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(opt => opt.code.toString() === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Calculate position for dropdown menu
  useEffect(() => {
    if (isOpen && buttonRef.current && menuRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const menu = menuRef.current;
      menu.style.left = `${buttonRect.left}px`;
      menu.style.top = `${buttonRect.bottom + 6}px`;
      menu.style.width = `${buttonRect.width}px`;
    }
  }, [isOpen]);

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Button */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
            {icon}
          </div>
          <button
            ref={buttonRef}
            type="button"
            onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
            disabled={disabled || loading}
            className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all outline-none appearance-none bg-white cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed hover:border-gray-300 flex items-center justify-between text-left min-w-0"
          >
            <span className={`flex-1 min-w-0 text-left ${selectedOption ? 'text-gray-900' : 'text-gray-400'}`} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedOption ? selectedOption.name : placeholder}
            </span>
            <ChevronDown 
              size={16} 
              className={`text-gray-400 flex-shrink-0 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Dropdown Menu - Fixed positioning to avoid scroll issues */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed bg-white border border-gray-200 rounded-lg shadow-xl z-[100] max-h-60 overflow-y-auto custom-dropdown-scroll"
            style={{ position: 'fixed' }}
          >
            {options.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                {loading ? "Đang tải..." : "Không có dữ liệu"}
              </div>
            ) : (
              options.map((option, index) => (
                <motion.div
                  key={option.code}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02, duration: 0.15 }}
                  onClick={() => {
                    onChange(option.code.toString());
                    setIsOpen(false);
                  }}
                  className={`px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                    value === option.code.toString()
                      ? "bg-gray-100 text-gray-900 font-medium"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{option.name}</span>
                    {value === option.code.toString() && (
                      <Check size={16} className="text-gray-600 flex-shrink-0 ml-2" />
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

