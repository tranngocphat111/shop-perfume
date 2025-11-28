import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  TicketPercent, 
  ArrowRight, 
  Check, 
  ChevronDown, 
  X,
  Gift,
  Coins
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { couponService, type Coupon } from '../../services/coupon.service';
import { userService, type UserInfo } from '../../services/user.service';
import { formatCurrency } from '../../utils/helpers';

// --- COMPONENT: COUPON CARD ---
const CouponCard = ({ 
  data, 
  isSelected, 
  onSelect,
  isValid,
  userPoints
}: { 
  data: Coupon, 
  isSelected: boolean, 
  onSelect: () => void,
  isValid: boolean,
  userPoints: number
}) => {
  // Format end date
  const formatEndDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return '31/12/2025';
    }
  };

  const hasEnoughPoints = userPoints >= data.requiredPoints;

  return (
    <div 
      onClick={isValid && hasEnoughPoints ? onSelect : undefined}
      className={`
        relative group overflow-hidden rounded-xl border-2 transition-all duration-200 flex flex-col justify-between min-h-[120px]
        ${isSelected 
          ? 'border-black bg-gray-50 shadow-sm cursor-pointer' 
          : isValid && hasEnoughPoints
          ? 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-md cursor-pointer'
          : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
        }
      `}
    >
      {/* Decorative Circle (Lỗ bấm vé) */}
      <div className={`absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-r border-inherit bg-gray-50 z-10 box-border ${isSelected ? 'border-black' : 'border-gray-100'}`} />
      <div className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-l border-inherit bg-gray-50 z-10 box-border ${isSelected ? 'border-black' : 'border-gray-100'}`} />

      <div className="p-4 pl-6 flex flex-col h-full justify-between relative z-0">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
             <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-black group-hover:text-white transition-colors'}`}>
               <TicketPercent size={18} />
             </div>
             <span className={`font-bold text-base ${isSelected ? 'text-black' : 'text-gray-800'}`}>
               {data.code}
             </span>
          </div>
          {isSelected && (
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              className="bg-black text-white rounded-full p-0.5"
            >
              <Check size={14} />
            </motion.div>
          )}
        </div>
        
        <div className="mt-3">
          <p className="text-sm text-gray-600 font-medium">{data.description}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-400">HSD: {formatEndDate(data.endDate)}</p>
            <div className="flex items-center gap-1 text-xs">
              <Coins size={12} className={hasEnoughPoints ? 'text-amber-500' : 'text-gray-400'} />
              <span className={hasEnoughPoints ? 'text-amber-600 font-semibold' : 'text-gray-400'}>
                {data.requiredPoints} điểm
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
interface CartSummaryProps {
  total: number;
  itemCount?: number;
  discount?: number;
  onCouponApply?: (couponId: number | null, discountAmount: number) => void;
}

export default function CartSummary({ total, itemCount, discount = 0, onCouponApply }: CartSummaryProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { appliedCouponId, setAppliedCouponId, setDiscount } = useCart();
  
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<number | null>(appliedCouponId);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isStickyVisible, setIsStickyVisible] = useState(false);
  const [showStickyCoupons, setShowStickyCoupons] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAllCoupons, setShowAllCoupons] = useState(false);
   
  const mainSectionRef = useRef<HTMLDivElement>(null);

  // Load user info and coupons when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Load user info first, then coupons
      loadUserInfo().then(() => {
        loadCoupons();
      });
    } else {
      setCoupons([]);
      setSelectedCouponId(null);
      setUserInfo(null);
    }
  }, [isAuthenticated]);

  // Auto validate selected coupon when total changes
  useEffect(() => {
    if (selectedCouponId && total > 0 && userInfo) {
      validateAndApplyCoupon(selectedCouponId);
    }
  }, [total, selectedCouponId, userInfo]);

  // Sync with CartContext
  useEffect(() => {
    if (selectedCouponId !== appliedCouponId) {
      if (selectedCouponId) {
        validateAndApplyCoupon(selectedCouponId);
      } else {
        handleRemoveCoupon();
      }
    }
  }, [selectedCouponId]);

  const loadUserInfo = async (): Promise<void> => {
    try {
      console.log('🔄 [CartSummary] Loading user info...');
      const token = localStorage.getItem('auth_token');
      console.log('🔄 [CartSummary] Token exists:', !!token);
      
      const info = await userService.getCurrentUser();
      if (info) {
        setUserInfo(info);
        console.log('✅ [CartSummary] Loaded user info - Loyalty Points:', info.loyaltyPoints);
      } else {
        console.warn('⚠️ [CartSummary] User info is null');
      }
    } catch (error: any) {
      console.error('❌ [CartSummary] Error loading user info:', error);
      console.error('Error details:', {
        status: error?.status,
        message: error?.message,
        response: error?.response
      });
    }
  };

  const loadCoupons = async () => {
    try {
      setIsLoading(true);
      // Get coupons (already sorted: canUse = true first)
      const availableCoupons = await couponService.getAvailableCoupons();
      setCoupons(availableCoupons);
    } catch (error: any) {
      console.error('Error loading coupons:', error);
      setCoupons([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Validate and apply coupon
  const validateAndApplyCoupon = async (couponId: number) => {
    try {
      const result = await couponService.validateCouponWithPoints(couponId, total);
      
      if (result.valid && result.discountAmount) {
        setDiscount(result.discountAmount);
        setAppliedCouponId(couponId);
        onCouponApply?.(couponId, result.discountAmount);
      } else {
        // Invalid coupon - remove selection
        handleRemoveCoupon();
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      handleRemoveCoupon();
    }
  };

  const handleSelectCoupon = (couponId: number | null) => {
    if (couponId === null) {
      handleRemoveCoupon();
      return;
    }

    const coupon = coupons.find(c => c.couponId === couponId);
    if (!coupon) return;

    // Check if user has enough points
    if (userInfo && userInfo.loyaltyPoints < coupon.requiredPoints) {
      console.warn('Not enough loyalty points');
      return;
    }

    setSelectedCouponId(couponId);
  };

  const handleRemoveCoupon = () => {
    setSelectedCouponId(null);
    setDiscount(0);
    setAppliedCouponId(null);
    onCouponApply?.(null, 0);
  };

  const finalTotal = total - discount;
  const selectedCoupon = coupons.find(c => c.couponId === selectedCouponId);
  
  // Đếm số coupon khả dụng (có thể dùng)
  const usableCoupons = coupons.filter(c => {
    if (!userInfo) return false;
    return userInfo.loyaltyPoints >= c.requiredPoints;
  });
  
  // Hiển thị tất cả coupon, nhưng ưu tiên hiển thị 5 coupon khả dụng đầu tiên
  // Sắp xếp: coupon khả dụng lên đầu, sau đó là coupon không khả dụng
  const sortedCoupons = [...coupons].sort((a, b) => {
    const aCanUse = userInfo ? userInfo.loyaltyPoints >= a.requiredPoints : false;
    const bCanUse = userInfo ? userInfo.loyaltyPoints >= b.requiredPoints : false;
    if (aCanUse && !bCanUse) return -1;
    if (!aCanUse && bCanUse) return 1;
    return 0;
  });
  
  // Chỉ hiển thị 5 coupon đầu tiên (ưu tiên các coupon khả dụng)
  const displayedCoupons = showAllCoupons ? sortedCoupons : sortedCoupons.slice(0, 5);
  const hasMoreCoupons = sortedCoupons.length > 5;

  // Handle sticky footer visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStickyVisible(!entry.isIntersecting);
        if (entry.isIntersecting) setShowStickyCoupons(false);
      },
      { threshold: 0.1 }
    );
    if (mainSectionRef.current) observer.observe(mainSectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div 
        ref={mainSectionRef}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        {/* Chỉ hiển thị coupon section nếu user đã đăng nhập VÀ có coupons */}
        {isAuthenticated && coupons.length > 0 && (
          <>
            {/* SECTION 1: ƯU ĐÃI */}
            <div className="p-6 lg:p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Gift className="text-red-500" size={20} />
                  Thêm ưu đãi
                </h2>
                <div className="flex items-center gap-3">
                  {userInfo ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-300 rounded-lg shadow-sm">
                      <Coins size={16} className="text-amber-600" />
                      <span className="text-sm font-bold text-amber-800">{userInfo.loyaltyPoints.toLocaleString('vi-VN')}</span>
                      <span className="text-xs text-amber-700 font-medium">điểm</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg">
                      <Coins size={16} className="text-gray-400" />
                      <span className="text-xs text-gray-500">Đang tải...</span>
                    </div>
                  )}
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                    {isLoading ? 'Đang tải...' : `${usableCoupons.length} mã khả dụng`}
                  </span>
                </div>
              </div>
              

              {/* GRID LAYOUT CHO COUPON */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Option: Không dùng mã */}
                <div 
                  onClick={() => handleSelectCoupon(null)}
                  className={`
                    cursor-pointer rounded-xl border-2 border-dashed flex items-center justify-center gap-3 transition-all min-h-[120px] hover:bg-gray-50
                    ${!selectedCouponId ? 'border-black bg-gray-50 text-black' : 'border-gray-200 text-gray-400'}
                  `}
                >
                  <span className="font-medium text-sm">Không áp dụng ưu đãi</span>
                </div>

                {displayedCoupons.map((coupon) => {
                  const canUse = userInfo ? userInfo.loyaltyPoints >= coupon.requiredPoints : false;
                  return (
                    <CouponCard 
                      key={coupon.couponId} 
                      data={coupon} 
                      isSelected={selectedCouponId === coupon.couponId}
                      isValid={canUse}
                      userPoints={userInfo?.loyaltyPoints || 0}
                      onSelect={() => {
                        // Chỉ cho phép chọn nếu đủ điểm
                        if (canUse) {
                          handleSelectCoupon(coupon.couponId);
                        }
                      }}
                    />
                  );
                })}
              </div>
              
              {/* Nút Xem thêm / Thu gọn */}
              {hasMoreCoupons && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => setShowAllCoupons(!showAllCoupons)}
                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
                  >
                    {showAllCoupons ? (
                      <>
                        <ChevronDown size={16} className="rotate-180" />
                        Thu gọn
                      </>
                    ) : (
                      <>
                        Xem thêm ({sortedCoupons.length - 5} mã khác)
                        <ChevronDown size={16} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* SECTION 2: TÓM TẮT ĐƠN HÀNG */}
        <div className="bg-gray-50 border-t border-gray-100 p-6 lg:p-8">
          <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
            
            {/* Breakdown bên trái - Tăng width */}
            <div className="w-full md:w-auto md:flex-[1.5] space-y-2">
              {/* Số lượng sản phẩm */}
              {itemCount !== undefined && itemCount > 0 && (
                <div className="flex justify-between md:justify-start md:gap-8 text-gray-500 text-sm mb-1">
                  <span className="font-medium">Số lượng sản phẩm</span>
                  <span className="font-semibold text-gray-700">
                    {itemCount} {itemCount === 1 ? 'sản phẩm' : 'sản phẩm'}
                  </span>
                </div>
              )}
              <div className="flex justify-between md:justify-start md:gap-8 text-gray-600 text-sm md:text-base">
                <span className="font-medium">Tổng tiền hàng</span>
                <span className="font-semibold text-gray-900">{formatCurrency(total)}</span>
              </div>
              {isAuthenticated && selectedCoupon && discount > 0 && (
                <div className="flex justify-between md:justify-start md:gap-8 text-green-600 text-sm md:text-base">
                  <span className="flex items-center gap-1.5 font-medium">
                    <TicketPercent size={16}/> {selectedCoupon.code}
                  </span>
                  <span className="font-bold">-{formatCurrency(discount)}</span>
                </div>
              )}
              <p className="text-xs text-gray-400 italic pt-2 max-w-md">
                * Phí vận chuyển sẽ được tính tại bước thanh toán.
              </p>
            </div>

            {/* Total & Action bên phải - Giảm width */}
            <div className="w-full md:w-auto md:flex-[1] flex flex-col md:items-end gap-3 md:min-w-[200px] md:max-w-[280px]">
              <div className="flex items-baseline justify-between md:justify-end gap-4 w-full">
                <span className="text-gray-500 font-medium text-sm md:text-base">Thành tiền</span>
                <span className="text-2xl md:text-3xl font-extrabold text-black">{formatCurrency(finalTotal)}</span>
              </div>
              
              <button 
                onClick={() => navigate('/checkout')}
                className="w-full md:w-auto bg-black text-white hover:bg-gray-800 px-6 md:px-8 py-3 md:py-3.5 rounded-xl font-bold text-sm md:text-base shadow-lg transition-all flex justify-center items-center gap-2"
              >
                Tiếp tục thanh toán
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* === STICKY FOOTER (Cho Mobile) === */}
      <AnimatePresence>
        {isStickyVisible && (
          <>
            {showStickyCoupons && (
              <motion.div
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setShowStickyCoupons(false)}
                className="fixed inset-0 bg-black/30 z-40 "
              />
            )}

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border-t border-gray-100"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              
              {/* Popup Coupon Mini trong footer */}
              <AnimatePresence>
                {showStickyCoupons && isAuthenticated && coupons.length > 0 && (
                  <motion.div
                    initial={{ height: 0 }} 
                    animate={{ height: "auto" }} 
                    exit={{ height: 0 }}
                    className="overflow-hidden border-b border-gray-100 bg-gray-50"
                  >
                    <div className="max-w-6xl mx-auto px-4 py-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold flex items-center gap-2 text-sm">
                          <TicketPercent size={18} /> Chọn nhanh ưu đãi
                        </span>
                        <button 
                          onClick={() => setShowStickyCoupons(false)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto">
                        {/* Option: Không áp dụng ưu đãi */}
                        <div 
                          onClick={() => {
                            handleSelectCoupon(null);
                            setShowStickyCoupons(false);
                          }}
                          className={`p-3 rounded border-2 border-dashed text-sm cursor-pointer transition-colors flex items-center justify-center min-h-[60px] ${
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
                                    handleSelectCoupon(c.couponId);
                                    setShowStickyCoupons(false);
                                  }
                                }}
                                className={`p-3 rounded border text-sm cursor-pointer transition-colors ${
                                  selectedCouponId === c.couponId 
                                    ? 'border-black bg-gray-50' 
                                    : canUse
                                    ? 'bg-white hover:bg-gray-50'
                                    : 'bg-gray-50 opacity-60 cursor-not-allowed'
                                }`}
                              >
                                <div className="font-bold">{c.code}</div>
                                <div className="text-xs text-gray-500 truncate">{c.description}</div>
                                <div className="flex items-center gap-1 mt-1">
                                  <Coins size={10} className="text-amber-500" />
                                  <span className={`text-xs ${canUse ? 'text-amber-600' : 'text-gray-400'}`}>
                                    {c.requiredPoints} điểm
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-3 rounded border border-gray-200 bg-gray-50 text-sm text-gray-500 text-center col-span-1">
                            Chưa có mã giảm giá
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Thanh điều khiển chính */}
              <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-3 md:gap-4">
                {/* Left Section */}
                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                  {isAuthenticated && coupons.length > 0 && (
                    <button 
                      onClick={() => setShowStickyCoupons(!showStickyCoupons)}
                      className={`
                        flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs md:text-sm font-semibold border-2 transition-all whitespace-nowrap
                        ${selectedCouponId 
                          ? 'bg-black text-white border-black shadow-sm' 
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                        }
                      `}
                    >
                      <TicketPercent size={16} className={selectedCouponId ? 'text-white' : 'text-gray-600'} />
                      <span className="hidden sm:inline">
                        {selectedCoupon ? selectedCoupon.code : 'Thêm mã'}
                      </span>
                      <ChevronDown size={12} className={`transition-transform ${showStickyCoupons ? 'rotate-180' : ''} ${selectedCouponId ? 'text-white' : 'text-gray-500'}`}/>
                    </button>
                  )}

                  {/* Số lượng sản phẩm - Badge đẹp hơn */}
                  {itemCount !== undefined && itemCount > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                      <span className="text-xs font-bold text-gray-700">
                        {itemCount}
                      </span>
                      <span className="text-xs text-gray-600 hidden sm:inline">
                        {itemCount === 1 ? 'sản phẩm' : 'sản phẩm'}
                      </span>
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex flex-col min-w-0 ml-auto md:ml-0">
                    <span className="text-[9px] md:text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Tổng cộng</span>
                    <span className="text-base md:text-xl font-extrabold text-black truncate leading-tight">
                      {formatCurrency(finalTotal)}
                    </span>
                  </div>
                </div>

                {/* Right Section - Button */}
                <button 
                  onClick={() => navigate('/checkout')}
                  className="bg-gradient-to-r from-black to-gray-800 text-white px-5 md:px-8 py-2.5 md:py-3 rounded-xl font-bold text-xs md:text-sm hover:from-gray-800 hover:to-gray-900 transition-all shadow-lg hover:shadow-xl active:scale-95 whitespace-nowrap flex-shrink-0 flex items-center gap-2"
                >
                  <span>Tiếp tục thanh toán</span>
                  <ArrowRight size={16} className="hidden sm:inline" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
