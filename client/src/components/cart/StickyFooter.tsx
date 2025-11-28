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
  onSelectCoupon
}: StickyFooterProps) {
  const navigate = useNavigate();
  const finalTotal = total - discount;

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
            <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-3 md:gap-4">
              {/* Left Section */}
              <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                {isAuthenticated && coupons.length > 0 && (
                  <button 
                    onClick={onToggleCouponPopup}
                    className={`
                      flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm md:text-base font-semibold border-2 transition-all whitespace-nowrap
                      ${selectedCouponId 
                        ? 'bg-black text-white border-black shadow-sm' 
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                      }
                    `}
                  >
                    <TicketPercent size={18} className={selectedCouponId ? 'text-white' : 'text-gray-600'} />
                    <span className="hidden sm:inline">
                      {selectedCoupon ? selectedCoupon.code : 'Thêm mã'}
                    </span>
                    <ChevronDown size={14} className={`transition-transform ${showCouponPopup ? 'rotate-180' : ''} ${selectedCouponId ? 'text-white' : 'text-gray-500'}`}/>
                  </button>
                )}

                {/* Số lượng sản phẩm - Badge đẹp hơn */}
                {itemCount !== undefined && itemCount > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    <span className="text-sm font-bold text-gray-700">
                      {itemCount}
                    </span>
                    <span className="text-sm text-gray-600 hidden sm:inline">
                      {itemCount === 1 ? 'sản phẩm' : 'sản phẩm'}
                    </span>
                  </div>
                )}

                {/* Total - Thiết kế lại gọn gàng hơn */}
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="text-xs md:text-sm text-gray-500 font-medium whitespace-nowrap">Tổng cộng:</span>
                  <span className="text-xl md:text-2xl font-extrabold text-black truncate leading-tight">
                    {formatCurrency(finalTotal)}
                  </span>
                </div>
              </div>

              {/* Right Section - Button */}
              <button 
                onClick={() => navigate('/checkout')}
                className="bg-gradient-to-r from-black to-gray-800 text-white px-5 md:px-8 py-2.5 md:py-3 rounded-xl font-bold text-sm md:text-base hover:from-gray-800 hover:to-gray-900 transition-all shadow-lg hover:shadow-xl active:scale-95 whitespace-nowrap flex-shrink-0 flex items-center gap-2"
              >
                <span>Tiếp tục thanh toán</span>
                <ArrowRight size={18} className="hidden sm:inline" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

