import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { couponService, type Coupon } from '../../services/coupon.service';
import { userService, type UserInfo } from '../../services/user.service';
import CouponSection from './CouponSection';
import OrderSummary from './OrderSummary';
import StickyFooter from './StickyFooter';

// --- MAIN COMPONENT ---
interface CartSummaryProps {
  total: number;
  itemCount?: number;
  discount?: number;
  onCouponApply?: (couponId: number | null, discountAmount: number) => void;
  disabled?: boolean; // Disable khi tổng = 0
}

export default function CartSummary({ total, itemCount, discount = 0, onCouponApply, disabled = false }: CartSummaryProps) {
  const { isAuthenticated } = useAuth();
  const { appliedCouponId, setAppliedCouponId, setDiscount } = useCart();
  
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<number | null>(appliedCouponId);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isStickyVisible, setIsStickyVisible] = useState(false);
  const [showStickyCoupons, setShowStickyCoupons] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
   
  const orderSummaryRef = useRef<HTMLDivElement>(null);

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

  const selectedCoupon = coupons.find(c => c.couponId === selectedCouponId);

  // Handle sticky footer visibility - chỉ ẩn khi phần OrderSummary (thanh toán lớn) xuất hiện
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Sticky footer ẩn khi OrderSummary xuất hiện trong viewport
        setIsStickyVisible(!entry.isIntersecting);
        if (entry.isIntersecting) setShowStickyCoupons(false);
      },
      { threshold: 0.1, rootMargin: '0px' }
    );
    if (orderSummaryRef.current) observer.observe(orderSummaryRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Chỉ hiển thị coupon section nếu user đã đăng nhập VÀ có coupons */}
        {isAuthenticated && coupons.length > 0 && (
          <CouponSection
            coupons={coupons}
            selectedCouponId={selectedCouponId}
            userInfo={userInfo}
            isLoading={isLoading}
            onSelectCoupon={handleSelectCoupon}
          />
        )}

        {/* SECTION 2: TÓM TẮT ĐƠN HÀNG - Được observe để ẩn sticky footer */}
        <OrderSummary
          ref={orderSummaryRef}
          total={total}
          discount={discount}
          itemCount={itemCount}
          isAuthenticated={isAuthenticated}
          selectedCoupon={selectedCoupon}
          disabled={disabled}
        />
      </div>

      {/* === STICKY FOOTER (Cho Mobile) === */}
      <StickyFooter
        isVisible={isStickyVisible}
        total={total}
        discount={discount}
        itemCount={itemCount}
        isAuthenticated={isAuthenticated}
        coupons={coupons}
        selectedCouponId={selectedCouponId}
        selectedCoupon={selectedCoupon}
        userInfo={userInfo}
        showCouponPopup={showStickyCoupons}
        onToggleCouponPopup={() => setShowStickyCoupons(!showStickyCoupons)}
        onSelectCoupon={handleSelectCoupon}
        disabled={disabled}
      />
    </>
  );
}
