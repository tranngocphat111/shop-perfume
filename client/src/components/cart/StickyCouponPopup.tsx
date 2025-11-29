import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { TicketPercent, X, Coins } from 'lucide-react';
import { type Coupon } from '../../services/coupon.service';
import { type UserInfo } from '../../services/user.service';

interface StickyCouponPopupProps {
  isVisible: boolean;
  coupons: Coupon[];
  selectedCouponId: number | null;
  userInfo: UserInfo | null;
  onSelectCoupon: (couponId: number | null) => void;
  onClose: () => void;
}

export default function StickyCouponPopup({
  isVisible,
  coupons,
  selectedCouponId,
  userInfo,
  onSelectCoupon,
  onClose
}: StickyCouponPopupProps) {
  const [footerHeight, setFooterHeight] = useState(80);

  useEffect(() => {
    const updateFooterHeight = () => {
      const footer = document.getElementById('sticky-footer');
      if (footer) {
        const rect = footer.getBoundingClientRect();
        setFooterHeight(rect.height);
      }
    };
    
    if (isVisible) {
      // Delay nhỏ để đảm bảo sticky footer đã render
      const timer = setTimeout(updateFooterHeight, 50);
      updateFooterHeight();
      
      window.addEventListener('resize', updateFooterHeight);
      const interval = setInterval(updateFooterHeight, 100);
      
      return () => {
        clearTimeout(timer);
        clearInterval(interval);
        window.removeEventListener('resize', updateFooterHeight);
      };
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          <motion.div
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-[65]"
          />
          <motion.div
            initial={{ transform: `translateY(100%)`, opacity: 0 }} 
            animate={{ transform: 'translateY(0)', opacity: 1 }} 
            exit={{ transform: `translateY(100%)`, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-0 right-0 bg-white border-b border-gray-200 shadow-[0_4px_20px_rgba(0,0,0,0.15)] z-[75] max-h-[60vh] overflow-y-auto"
            style={{ 
              bottom: `${footerHeight}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-6xl mx-auto px-4 py-4">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold flex items-center gap-2 text-lg">
                  <TicketPercent size={22} className="text-red-500" /> Chọn nhanh ưu đãi
                </span>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* Option: Không áp dụng ưu đãi */}
                <div 
                  onClick={() => {
                    onSelectCoupon(null);
                    onClose();
                  }}
                  className={`p-3 rounded border-2 border-dashed text-base cursor-pointer transition-colors flex items-center justify-center min-h-[60px] ${
                    !selectedCouponId 
                      ? 'border-black bg-gray-50 text-black font-bold' 
                      : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <span className="text-center">Không áp dụng</span>
                </div>
                
                {coupons.length > 0 ? (
                  coupons.map(c => {
                    const canUse = userInfo ? userInfo.loyaltyPoints >= c.requiredPoints : false;
                    return (
                      <div 
                        key={c.couponId} 
                        onClick={() => {
                          if (canUse) {
                            onSelectCoupon(c.couponId);
                            onClose();
                          }
                        }}
                        className={`p-3 rounded border text-base cursor-pointer transition-colors ${
                          selectedCouponId === c.couponId 
                            ? 'border-black bg-gray-50' 
                            : canUse
                            ? 'bg-white hover:bg-gray-50'
                            : 'bg-gray-50 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="font-bold text-base">{c.code}</div>
                        <div className="text-sm text-gray-500 truncate">{c.description}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <Coins size={12} className="text-amber-500" />
                          <span className={`text-sm ${canUse ? 'text-amber-600' : 'text-gray-400'}`}>
                            {c.requiredPoints} điểm
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 rounded border border-gray-200 bg-gray-50 text-base text-gray-500 text-center col-span-1">
                    Chưa có mã giảm giá
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

