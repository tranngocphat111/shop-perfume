import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, TicketPercent, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/helpers';
import { type Coupon } from '../../services/coupon.service';
import StickyCouponPopup from './StickyCouponPopup';

interface StickyFooterProps {
  isVisible: boolean;
  total: number;
  discount: number;
  itemCount?: number;
  isAuthenticated: boolean;
  coupons: Coupon[];
  selectedCouponId: number | null;
  selectedCoupon: Coupon | undefined;
  userInfo: any;
  showCouponPopup: boolean;
  onToggleCouponPopup: () => void;
  onSelectCoupon: (couponId: number | null) => void;
  disabled?: boolean; // Disable khi tổng = 0
}

export default function StickyFooter({
  isVisible,
  total,
  discount,
  itemCount,
  isAuthenticated,
  coupons,
  selectedCouponId,
  selectedCoupon,
  userInfo,
  showCouponPopup,
  onToggleCouponPopup,
  onSelectCoupon,
  disabled = false
}: StickyFooterProps) {
  const navigate = useNavigate();
  const finalTotal = total - discount;
  const isDisabled = disabled || finalTotal <= 0;

  return (
    <>
      <StickyCouponPopup
        isVisible={showCouponPopup && isVisible}
        coupons={coupons}
        selectedCouponId={selectedCouponId}
        userInfo={userInfo}
        onSelectCoupon={onSelectCoupon}
        onClose={onToggleCouponPopup}
      />
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-[80] bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border-t border-gray-100"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            id="sticky-footer"
          >
            {/* Thanh điều khiển chính */}
            <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
              {/* Mobile: Stack layout */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 md:gap-4">
                {/* Left Section */}
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0 flex-wrap">
                  {isAuthenticated && coupons.length > 0 && (
                    <button 
                      onClick={onToggleCouponPopup}
                      className={`
                        flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm md:text-base font-semibold border-2 transition-all whitespace-nowrap flex-shrink-0
                        ${selectedCouponId 
                          ? 'bg-black text-white border-black shadow-sm' 
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                        }
                      `}
                    >
                      <TicketPercent size={16} className={`sm:w-[18px] sm:h-[18px] ${selectedCouponId ? 'text-white' : 'text-gray-600'}`} />
                      <span className="hidden sm:inline">
                        {selectedCoupon ? selectedCoupon.code : 'Thêm mã'}
                      </span>
                      <ChevronDown size={12} className={`sm:w-[14px] sm:h-[14px] transition-transform ${showCouponPopup ? 'rotate-180' : ''} ${selectedCouponId ? 'text-white' : 'text-gray-500'}`}/>
                    </button>
                  )}

                  {/* Số lượng sản phẩm - Badge đẹp hơn */}
                  {itemCount !== undefined && itemCount > 0 && (
                    <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg sm:rounded-xl border border-gray-200 flex-shrink-0">
                      <span className="text-xs sm:text-sm font-bold text-gray-700">
                        {itemCount}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">
                        {itemCount === 1 ? 'sản phẩm' : 'sản phẩm'}
                      </span>
                    </div>
                  )}

                  {/* Total - Thiết kế lại gọn gàng hơn */}
                  <div className="flex items-baseline gap-1.5 sm:gap-2 min-w-0 flex-1 sm:flex-initial">
                    <span className="text-[10px] sm:text-xs md:text-sm text-gray-500 font-medium whitespace-nowrap">Tổng cộng:</span>
                    <span className="text-lg sm:text-xl md:text-2xl font-extrabold text-black truncate leading-tight">
                      {formatCurrency(finalTotal)}
                    </span>
                  </div>
                </div>

                {/* Right Section - Button */}
                <button 
                  onClick={() => !isDisabled && navigate('/checkout')}
                  disabled={isDisabled}
                  className={`relative btn-slide-overlay-dark overflow-hidden w-full md:w-auto px-4 md:px-8 py-2 md:py-2.5 rounded-full font-bold text-base md:text-lg shadow-lg transition-all flex justify-center items-center gap-2 ${
                    isDisabled 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  <span className="hidden sm:inline relative z-10">Thanh toán</span>
                  <span className="sm:hidden">Thanh toán</span>
                  
                  <ArrowRight size={16} className={`relative z-10 sm:w-[18px] sm:h-[18px] hidden sm:inline`} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

