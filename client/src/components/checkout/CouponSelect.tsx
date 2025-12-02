import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Gift, Coins } from "lucide-react";
import { type Coupon } from "../../services/coupon.service";
import { type UserInfo } from "../../services/user.service";

interface CouponSelectProps {
  coupons: Coupon[];
  selectedCouponId: number | null;
  userInfo: UserInfo | null;
  isLoading: boolean;
  onSelectCoupon: (couponId: number | null) => void;
}

export const CouponSelect = ({
  coupons,
  selectedCouponId,
  userInfo,
  isLoading,
  onSelectCoupon,
}: CouponSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedCoupon = coupons.find(c => c.couponId === selectedCouponId);

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
  const updatePosition = () => {
    if (isOpen && buttonRef.current && menuRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const menu = menuRef.current;
      menu.style.left = `${buttonRect.left}px`;
      menu.style.top = `${buttonRect.bottom + 6}px`;
      menu.style.width = `${buttonRect.width}px`;
    }
  };

  useEffect(() => {
    updatePosition();
  }, [isOpen]);

  // Update position on scroll and resize
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => {
      updatePosition();
    };

    const handleResize = () => {
      updatePosition();
    };

    // Update position immediately
    updatePosition();

    // Add event listeners
    window.addEventListener('scroll', handleScroll, true); // Use capture to catch all scroll events
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  // Sort coupons: usable first, then by discount percent
  const sortedCoupons = [...coupons].sort((a, b) => {
    const aCanUse = userInfo ? userInfo.loyaltyPoints >= a.requiredPoints : false;
    const bCanUse = userInfo ? userInfo.loyaltyPoints >= b.requiredPoints : false;
    if (aCanUse && !bCanUse) return -1;
    if (!aCanUse && bCanUse) return 1;
    return b.discountPercent - a.discountPercent;
  });

  const getDisplayText = () => {
    if (selectedCoupon) {
      return `${selectedCoupon.code} - Giảm ${selectedCoupon.discountPercent}%`;
    }
    return "Chọn mã ưu đãi";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Gift className="text-red-500" size={24} />
          Lựa chọn ưu đãi
        </h2>
        {userInfo && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-300 rounded-lg shadow-sm">
            <Coins size={18} className="text-amber-600" />
            <span className="text-base font-bold text-amber-800">{userInfo.loyaltyPoints.toLocaleString('vi-VN')}</span>
            <span className="text-sm text-amber-700 font-medium">điểm</span>
          </div>
        )}
      </div>

      <div className="relative" ref={dropdownRef}>
        {/* Button */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
            <Gift size={18} />
          </div>
          <button
            ref={buttonRef}
            type="button"
            onClick={() => !isLoading && setIsOpen(!isOpen)}
            disabled={isLoading}
            className="w-full pl-10 pr-3 py-3 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all outline-none appearance-none bg-white cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed hover:border-gray-300 flex items-center justify-between text-left min-w-0"
          >
            <span className={`flex-1 min-w-0 text-left ${selectedCoupon ? 'text-gray-900 font-medium' : 'text-gray-400'}`} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isLoading ? "Đang tải..." : getDisplayText()}
            </span>
            <ChevronDown 
              size={16} 
              className={`text-gray-400 flex-shrink-0 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="fixed bg-white border border-gray-200 rounded-lg shadow-xl z-[100] max-h-96 overflow-y-auto custom-dropdown-scroll"
              style={{ position: 'fixed' }}
            >
              {/* Option: Không áp dụng */}
              <motion.div
                onClick={() => {
                  onSelectCoupon(null);
                  setIsOpen(false);
                }}
                className={`px-4 py-3 cursor-pointer transition-colors flex items-center justify-between border-b border-gray-100 ${
                  !selectedCouponId 
                    ? 'bg-gray-50' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    !selectedCouponId 
                      ? 'border-black bg-black' 
                      : 'border-gray-300 bg-white'
                  }`}>
                    {!selectedCouponId && <Check size={14} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${!selectedCouponId ? 'text-gray-900' : 'text-gray-600'}`}>
                      Không áp dụng ưu đãi
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Coupon Options */}
              {sortedCoupons.map((coupon) => {
                const canUse = userInfo ? userInfo.loyaltyPoints >= coupon.requiredPoints : false;
                const isSelected = selectedCouponId === coupon.couponId;
                
                return (
                  <motion.div
                    key={coupon.couponId}
                    onClick={() => {
                      if (canUse) {
                        onSelectCoupon(coupon.couponId);
                        setIsOpen(false);
                      }
                    }}
                    className={`px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${
                      isSelected 
                        ? 'bg-gray-50' 
                        : canUse
                        ? 'hover:bg-gray-50'
                        : 'opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected 
                            ? 'border-black bg-black' 
                            : canUse
                            ? 'border-gray-300 bg-white'
                            : 'border-gray-200 bg-gray-100'
                        }`}>
                          {isSelected && <Check size={14} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className={`text-sm font-bold ${isSelected ? 'text-gray-900' : canUse ? 'text-gray-800' : 'text-gray-500'}`}>
                              {coupon.code}
                            </p>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                              isSelected 
                                ? 'bg-black text-white' 
                                : canUse
                                ? 'bg-gray-200 text-gray-700'
                                : 'bg-gray-100 text-gray-400'
                            }`}>
                              -{coupon.discountPercent}%
                            </span>
                          </div>
                          <p className={`text-xs ${isSelected ? 'text-gray-600' : canUse ? 'text-gray-500' : 'text-gray-400'}`}>
                            {coupon.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Coins size={14} className={canUse ? 'text-amber-500' : 'text-gray-400'} />
                        <span className={`text-xs font-medium ${canUse ? 'text-amber-600' : 'text-gray-400'}`}>
                          {coupon.requiredPoints}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {sortedCoupons.length === 0 && !isLoading && (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  Không có mã ưu đãi khả dụng
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

     
    </div>
  );
};

