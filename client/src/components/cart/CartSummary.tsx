import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { formatCurrency } from '../../utils/helpers';
import { userCouponService, type UserCoupon } from '../../services/user-coupon.service';
import { useAuth } from '../../contexts/AuthContext';

interface CartSummaryProps {
  total: number;
  itemCount: number;
  discount?: number;
  onCouponApply?: (userCouponId: number | null, discountAmount: number) => void;
}

export const CartSummary = ({ total, itemCount, discount = 0, onCouponApply }: CartSummaryProps) => {
  const { isAuthenticated } = useAuth();
  const [isSticky, setIsSticky] = useState(false);
  const [selectedUserCouponId, setSelectedUserCouponId] = useState<number | null>(null);
  const [userCoupons, setUserCoupons] = useState<UserCoupon[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const normalSummaryRef = useRef<HTMLDivElement>(null);

  // Load user coupons when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadUserCoupons();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Khi normal summary không còn visible (đã scroll qua), hiển thị sticky
        setIsSticky(!entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: '0px 0px -100px 0px', // Trigger trước khi scroll ra khỏi view
      }
    );

    if (normalSummaryRef.current) {
      observer.observe(normalSummaryRef.current);
    }

    return () => {
      if (normalSummaryRef.current) {
        observer.unobserve(normalSummaryRef.current);
      }
    };
  }, []);

  const loadUserCoupons = async () => {
    try {
      const coupons = await userCouponService.getMyCoupons();
      setUserCoupons(coupons);
    } catch (error) {
      console.error('Error loading user coupons:', error);
    }
  };

  const handleCouponChange = async (userCouponId: string) => {
    if (!userCouponId) {
      handleRemoveCoupon();
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const validation = await userCouponService.validateCoupon(parseInt(userCouponId), total);
      
      if (validation.valid && validation.discountAmount) {
        setSelectedUserCouponId(parseInt(userCouponId));
        setSuccessMessage(`Đã áp dụng mã giảm ${validation.discountPercent}%`);
        onCouponApply?.(parseInt(userCouponId), validation.discountAmount);
      } else {
        setErrorMessage(validation.message || 'Mã giảm giá không hợp lệ');
        setSelectedUserCouponId(null);
        onCouponApply?.(null, 0);
      }
    } catch (error) {
      setErrorMessage('Có lỗi xảy ra khi áp dụng mã giảm giá');
      setSelectedUserCouponId(null);
      onCouponApply?.(null, 0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setSelectedUserCouponId(null);
    setErrorMessage('');
    setSuccessMessage('');
    onCouponApply?.(null, 0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-6"
    >
      {/* Normal state - separate div with background */}
      <div ref={normalSummaryRef} className="bg-white p-4 md:p-8 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 lg:gap-6">
          {/* Left: Coupon Section - Chỉ hiển thị cho user đã đăng nhập */}
          {isAuthenticated && (
            <div className="flex flex-col gap-2 flex-shrink-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <label className="font-semibold text-gray-700 text-sm md:text-base whitespace-nowrap">
                  Mã giảm giá:
                </label>
                <div className="relative w-full sm:w-auto">
                  <select
                    value={selectedUserCouponId || ''}
                    onChange={(e) => handleCouponChange(e.target.value)}
                    disabled={isLoading || userCoupons.length === 0}
                    className={`w-full sm:w-[280px] md:w-[320px] py-2.5 md:py-3 pl-4 md:pl-5 pr-4 border rounded-full text-sm outline-none transition-all appearance-none cursor-pointer ${
                      selectedUserCouponId
                        ? 'border-green-500 bg-green-50 text-green-700 font-semibold'
                        : errorMessage
                        ? 'border-red-500 bg-red-50'
                        : userCoupons.length === 0
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <option value="">
                      {userCoupons.length === 0 ? 'Bạn chưa có mã giảm giá' : 'Chọn mã giảm giá'}
                    </option>
                    {userCoupons.map((coupon) => (
                      <option key={coupon.userCouponId} value={coupon.userCouponId}>
                        {coupon.code} - Giảm {coupon.discountPercent}% (Đơn tối thiểu{' '}
                        {formatCurrency(coupon.minOrderValue)}₫)
                      </option>
                    ))}
                  </select>
                  {/* Custom dropdown arrow */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              {/* Success message */}
              {successMessage && (
                <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200 animate-fade-in">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">{successMessage}</span>
                </div>
              )}
              {/* Error message */}
              {errorMessage && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200 animate-fade-in">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">{errorMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* Center: Summary Info */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3 flex-shrink-0">
            <div className="flex items-center gap-1.5 md:gap-2">
              <span className="text-xs md:text-sm text-gray-600">Số lượng:</span>
              <span className="text-sm md:text-base font-bold text-gray-900">{itemCount} sp</span>
            </div>
            {discount > 0 && (
              <>
                <div className="w-px h-4 md:h-6 bg-gray-300"></div>
                <div className="flex items-center gap-1.5 md:gap-2">
                  <span className="text-xs md:text-sm text-gray-600">Giảm giá:</span>
                  <span className="text-sm md:text-base font-bold text-red-600">-{formatCurrency(discount)} ₫</span>
                </div>
              </>
            )}
            <div className="w-px h-4 md:h-6 bg-gray-300"></div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <span className="text-xs md:text-sm text-gray-600">Tổng tiền:</span>
              <span className="text-lg md:text-xl font-bold text-black">{formatCurrency(total - discount)} ₫</span>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 flex-shrink-0">
            <Link
              to="/products"
              className="btn-slide-overlay relative px-5 md:px-6 py-2.5 md:py-3 border border-black text-black rounded-full text-sm font-semibold no-underline whitespace-nowrap overflow-hidden shadow-sm hover:shadow-md transition-shadow text-center"
            >
              <span className="relative z-10">Tiếp tục mua sắm</span>
            </Link>

            <Link
              to="/checkout"
              className="btn-slide-overlay-dark relative px-8 md:px-10 py-2.5 md:py-3 bg-black text-white rounded-full text-base md:text-md no-underline whitespace-nowrap shadow-lg hover:shadow-2xl overflow-hidden transition-shadow text-center"
            >
              <span className="relative z-10">Thanh toán</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Sticky footer - full width when sticky, only show when scrolled */}
      {isSticky && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1),0_-2px_4px_-2px_rgba(0,0,0,0.1)] z-[100]"
          style={{
            width: '100vw',
          }}
        >
          <div className="w-11/12 lg:w-4/5 mx-auto py-4 md:py-6">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 lg:gap-6">
              {/* Left: Coupon Section - Sticky - Chỉ hiển thị cho user đã đăng nhập */}
              {isAuthenticated && (
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    <label className="font-semibold text-gray-700 text-sm md:text-base whitespace-nowrap">
                      Mã giảm giá:
                    </label>
                    <div className="relative w-full sm:w-auto">
                      <select
                        value={selectedUserCouponId || ''}
                        onChange={(e) => handleCouponChange(e.target.value)}
                        disabled={isLoading || userCoupons.length === 0}
                        className={`w-full sm:w-[240px] md:w-[280px] py-2 md:py-2.5 pl-3 md:pl-4 pr-3 border rounded-full text-xs md:text-sm outline-none transition-all appearance-none cursor-pointer ${
                          selectedUserCouponId
                            ? 'border-green-500 bg-green-50 text-green-700 font-semibold'
                            : userCoupons.length === 0
                            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                            : 'border-gray-300'
                        }`}
                      >
                        <option value="">
                          {userCoupons.length === 0 ? 'Chưa có mã' : 'Chọn mã giảm giá'}
                        </option>
                        {userCoupons.map((coupon) => (
                          <option key={coupon.userCouponId} value={coupon.userCouponId}>
                            {coupon.code} - Giảm {coupon.discountPercent}%
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Center: Summary Info */}
              <div className="flex flex-wrap items-center gap-2 md:gap-3 flex-shrink-0">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <span className="text-xs md:text-sm text-gray-600">Số lượng:</span>
                  <span className="text-sm md:text-base font-bold text-gray-900">{itemCount} sp</span>
                </div>
                {discount > 0 && (
                  <>
                    <div className="w-px h-4 md:h-6 bg-gray-300"></div>
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <span className="text-xs md:text-sm text-gray-600">Giảm giá:</span>
                      <span className="text-sm md:text-base font-bold text-red-600">-{formatCurrency(discount)} ₫</span>
                    </div>
                  </>
                )}
                <div className="w-px h-4 md:h-6 bg-gray-300"></div>
                <div className="flex items-center gap-1.5 md:gap-2">
                  <span className="text-xs md:text-sm text-gray-600">Tổng tiền:</span>
                  <span className="text-lg md:text-xl font-bold text-black">{formatCurrency(total - discount)} ₫</span>
                </div>
              </div>

              {/* Right: Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 flex-shrink-0">
                <Link
                  to="/products"
                  className="btn-slide-overlay relative px-5 md:px-6 py-2.5 md:py-3 border border-black text-black rounded-full text-sm font-semibold no-underline whitespace-nowrap overflow-hidden shadow-sm hover:shadow-md transition-shadow text-center"
                >
                  <span className="relative z-10">Tiếp tục mua sắm</span>
                </Link>

                <Link
                  to="/checkout"
                  className="btn-slide-overlay-dark relative px-8 md:px-10 py-2.5 md:py-3 bg-black text-white rounded-full text-base md:text-md no-underline whitespace-nowrap shadow-lg hover:shadow-2xl overflow-hidden transition-shadow text-center"
                >
                  <span className="relative z-10">Thanh toán</span>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
