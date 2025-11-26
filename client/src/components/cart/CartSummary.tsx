import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { formatCurrency } from '../../utils/helpers';
import { couponService, type Coupon } from '../../services/coupon.service';

interface CartSummaryProps {
  total: number;
  itemCount: number;
  discount?: number;
  onCouponApply?: (coupon: Coupon | null, discountAmount: number) => void;
}

export const CartSummary = ({ total, itemCount, discount = 0, onCouponApply }: CartSummaryProps) => {
  const [couponCode, setCouponCode] = useState('');
  const [isSticky, setIsSticky] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [showCouponList, setShowCouponList] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const normalSummaryRef = useRef<HTMLDivElement>(null);

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

  // Load available coupons
  useEffect(() => {
    const loadCoupons = async () => {
      try {
        const coupons = await couponService.getAvailableCoupons();
        setAvailableCoupons(coupons);
      } catch (error) {
        console.error('Error loading coupons:', error);
      }
    };
    loadCoupons();
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setErrorMessage('Vui lòng nhập mã khuyến mãi');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const validation = await couponService.validateCoupon(couponCode.trim().toUpperCase(), total);
      
      if (validation.valid && validation.coupon) {
        setSelectedCoupon(validation.coupon);
        setCouponCode(validation.coupon.code);
        setShowCouponList(false);
        const discountAmount = validation.discountAmount || (total * validation.coupon.discountPercent) / 100;
        onCouponApply?.(validation.coupon, discountAmount);
      } else {
        setErrorMessage(validation.message || 'Mã giảm giá không hợp lệ');
        setSelectedCoupon(null);
        onCouponApply?.(null, 0);
      }
    } catch (error) {
      setErrorMessage('Có lỗi xảy ra khi áp dụng mã giảm giá');
      setSelectedCoupon(null);
      onCouponApply?.(null, 0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCoupon = async (coupon: Coupon) => {
    setCouponCode(coupon.code);
    setShowCouponList(false);
    setIsLoading(true);
    setErrorMessage('');

    try {
      const validation = await couponService.validateCoupon(coupon.code, total);
      
      if (validation.valid && validation.coupon) {
        setSelectedCoupon(validation.coupon);
        const discountAmount = validation.discountAmount || (total * validation.coupon.discountPercent) / 100;
        onCouponApply?.(validation.coupon, discountAmount);
      } else {
        setErrorMessage(validation.message || 'Mã giảm giá không hợp lệ');
        setSelectedCoupon(null);
        onCouponApply?.(null, 0);
      }
    } catch (error) {
      setErrorMessage('Có lỗi xảy ra khi áp dụng mã giảm giá');
      setSelectedCoupon(null);
      onCouponApply?.(null, 0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setSelectedCoupon(null);
    setErrorMessage('');
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
          {/* Left: Coupon Section */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <label className="font-semibold text-gray-700 text-sm md:text-base whitespace-nowrap">Mã khuyến mãi:</label>
              <div className="relative w-full sm:w-auto">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value);
                    setErrorMessage('');
                  }}
                  onFocus={() => setShowCouponList(true)}
                  placeholder="Nhập mã khuyến mãi"
                  className="w-full sm:w-[220px] md:w-[280px] py-2.5 md:py-3 pl-4 md:pl-5 pr-24 md:pr-28 border border-gray-300 rounded-full text-sm outline-none transition-all"
                />
                {selectedCoupon ? (
                  <button
                    onClick={handleRemoveCoupon}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 py-1.5 md:py-[6px] px-3 md:px-5 rounded-full border border-red-500 text-red-500 transition-all duration-200 text-xs md:text-sm whitespace-nowrap hover:bg-red-50"
                  >
                    <span>Hủy</span>
                  </button>
                ) : (
                  <button
                    onClick={handleApplyCoupon}
                    disabled={isLoading}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 py-1.5 md:py-[6px] px-3 md:px-5 rounded-full border border-gray-800 text-gray-800 transition-all duration-200 text-xs md:text-sm whitespace-nowrap btn-slide-overlay disabled:opacity-50"
                  >
                    <span>{isLoading ? '...' : 'Xác nhận'}</span>
                  </button>
                )}
              </div>
            </div>
            
            {/* Error message */}
            {errorMessage && (
              <p className="text-xs text-red-600 ml-0 sm:ml-[120px]">{errorMessage}</p>
            )}

            {/* Available coupons list */}
            {showCouponList && availableCoupons.length > 0 && !selectedCoupon && (
              <div className="relative ml-0 sm:ml-[120px]">
                <div className="absolute top-2 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  <div className="p-2">
                    <p className="text-xs font-semibold text-gray-700 mb-2 px-2">Mã giảm giá có sẵn:</p>
                    {availableCoupons
                      .filter(coupon => total >= coupon.minOrderValue)
                      .map((coupon) => (
                        <button
                          key={coupon.couponId}
                          onClick={() => handleSelectCoupon(coupon)}
                          className="w-full text-left p-2 hover:bg-gray-50 rounded transition-colors mb-1"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{coupon.code}</p>
                              <p className="text-xs text-gray-600">{coupon.description}</p>
                            </div>
                            <span className="text-sm font-bold text-red-600">
                              -{coupon.discountPercent}%
                            </span>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Selected coupon info */}
            {selectedCoupon && (
              <div className="ml-0 sm:ml-[120px] p-2 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-800">
                  <span className="font-semibold">{selectedCoupon.code}</span> - Giảm {selectedCoupon.discountPercent}%
                </p>
              </div>
            )}
          </div>

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
              {/* Left: Coupon Section */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  <label className="font-semibold text-gray-700 text-sm md:text-base whitespace-nowrap">Mã khuyến mãi:</label>
                  <div className="relative w-full sm:w-auto">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="Nhập mã khuyến mãi"
                      className="w-full sm:w-[220px] md:w-[280px] py-2.5 md:py-3 pl-4 md:pl-5 pr-24 md:pr-28 border border-gray-300 rounded-full text-sm outline-none transition-all"
                    />
                    {selectedCoupon ? (
                      <button
                        onClick={handleRemoveCoupon}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 py-1.5 md:py-[6px] px-3 md:px-5 rounded-full border border-red-500 text-red-500 transition-all duration-200 text-xs md:text-sm whitespace-nowrap hover:bg-red-50"
                      >
                        <span>Hủy</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleApplyCoupon}
                        disabled={isLoading}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 py-1.5 md:py-[6px] px-3 md:px-5 rounded-full border border-gray-800 text-gray-800 transition-all duration-200 text-xs md:text-sm whitespace-nowrap btn-slide-overlay disabled:opacity-50"
                      >
                        <span>{isLoading ? '...' : 'Xác nhận'}</span>
                      </button>
                    )}
                  </div>
                </div>
                {selectedCoupon && (
                  <div className="ml-0 sm:ml-[120px] p-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-green-800">
                      <span className="font-semibold">{selectedCoupon.code}</span> - Giảm {selectedCoupon.discountPercent}%
                    </p>
                  </div>
                )}
              </div>

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
