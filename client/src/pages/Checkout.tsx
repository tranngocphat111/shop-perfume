import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  ShippingForm, 
  PaymentMethodSelector, 
  OrderSummary, 
  CheckoutHeader,
  CheckoutNotifications 
} from '../components/checkout';
import { CouponSelect } from '../components/checkout/CouponSelect';
import { couponService, type Coupon } from '../services/coupon.service';
import { userService, type UserInfo } from '../services/user.service';
import { useCheckoutOrder } from '../hooks/useCheckoutOrder';
import type { CheckoutFormData } from '../types';

const initialFormData: CheckoutFormData = {
  fullName: '',
  phone: '',
  email: '',
  city: '',
  cityCode: '',
  district: '',
  districtCode: '',
  ward: '',
  wardCode: '',
  address: '',
  note: '',
  paymentMethod: 'cod',
};

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cart, appliedCouponId, discount, setAppliedCouponId, setDiscount } = useCart();
  const { user, isAuthenticated } = useAuth();
  
  // Filter out of stock items ngay từ đầu - chỉ lấy items còn hàng
  const cartItems = cart.items.filter(item => 
    item.stockQuantity === undefined || item.stockQuantity > 0
  );
  const [formData, setFormData] = useState<CheckoutFormData>(initialFormData);
  
  // Use custom hook for order submission logic
  const {
    isProcessing,
    validationErrors,
    showSuccessNotification,
    successMessage,
    isErrorNotification,
    handleSubmit: handleOrderSubmit,
    setShowSuccessNotification,
    setIsErrorNotification,
    setValidationErrors,
  } = useCheckoutOrder();
  
  // Coupon state
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<number | null>(appliedCouponId);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Redirect if cart is empty (but allow navigation to payment page first)
  useEffect(() => {
    // Only redirect if we're still on checkout page and cart is empty
    // Don't redirect if notification is showing (user might be seeing error message)
    if (cartItems.length === 0 && window.location.pathname === '/checkout' && !showSuccessNotification) {
      navigate('/cart');
    }
  }, [cartItems, navigate, showSuccessNotification]);

  // Auto-fill user information if logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        email: prev.email || user.email || '',
        // Note: phone and address are not in AuthResponse, so we keep user input
      }));
    }
  }, [isAuthenticated, user]);

  // Calculate total
  const total = cartItems.reduce(
    (sum, item) => sum + item.product.unitPrice * item.quantity,
    0
  );

  // Load user info and coupons when authenticated
  useEffect(() => {
    if (isAuthenticated) {
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
      const info = await userService.getCurrentUser();
      if (info) {
        setUserInfo(info);
      }
    } catch (error: any) {
      console.error('Error loading user info:', error);
    }
  };

  const loadCoupons = async () => {
    try {
      setIsLoadingCoupons(true);
      const availableCoupons = await couponService.getAvailableCoupons();
      setCoupons(availableCoupons);
    } catch (error: any) {
      console.error('Error loading coupons:', error);
      setCoupons([]);
    } finally {
      setIsLoadingCoupons(false);
    }
  };

  // Validate and apply coupon
  const validateAndApplyCoupon = async (couponId: number) => {
    try {
      const result = await couponService.validateCouponWithPoints(couponId, total);
      
      if (result.valid && result.discountAmount) {
        setDiscount(result.discountAmount);
        setAppliedCouponId(couponId);
      } else {
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
  };

  const updateFormData = (data: Partial<CheckoutFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
    // Clear validation errors for all fields being updated
    const newErrors = { ...validationErrors };
    // Map frontend field names to backend field names
    const fieldMapping: Record<string, string[]> = {
      fullName: ['fullName'],
      phone: ['phone'],
      email: ['email'],
      cityCode: ['city'],
      city: ['city'],
      districtCode: ['district'],
      district: ['district'],
      wardCode: ['ward'],
      ward: ['ward'],
      address: ['address'],
      paymentMethod: ['paymentMethod'],
    };

    // Clear errors for all related fields
    Object.keys(data).forEach(field => {
      const relatedFields = fieldMapping[field] || [field];
      relatedFields.forEach(relatedField => {
        if (newErrors[relatedField]) {
          delete newErrors[relatedField];
        }
      });
    });

    setValidationErrors(newErrors);
  };

  const handlePaymentMethodChange = (method: CheckoutFormData['paymentMethod']) => {
    updateFormData({ paymentMethod: method });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    let hasError = false;

    // Validate fullName
    if (!formData.fullName.trim()) {
      errors.fullName = 'Họ và tên không được để trống';
      hasError = true;
    } else if (formData.fullName.trim().length < 2 || formData.fullName.trim().length > 100) {
      errors.fullName = 'Họ và tên phải từ 2-100 ký tự';
      hasError = true;
    } else if (!/^[\p{L}\s]+$/u.test(formData.fullName.trim())) {
      errors.fullName = 'Họ và tên chỉ được chứa chữ cái và khoảng trắng';
      hasError = true;
    }

    // Validate phone
    if (!formData.phone.trim()) {
      errors.phone = 'Số điện thoại không được để trống';
      hasError = true;
    } else if (!/^(\+84|0)[0-9]{9,10}$/.test(formData.phone.trim())) {
      errors.phone = 'Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678)';
      hasError = true;
    }

    // Validate email
    if (!formData.email.trim()) {
      errors.email = 'Email không được để trống';
      hasError = true;
    } else if (formData.email.trim().length > 100) {
      errors.email = 'Email không được quá 100 ký tự';
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Email không hợp lệ';
      hasError = true;
    }

    // Validate address fields
    if (!formData.cityCode) {
      errors.city = 'Vui lòng chọn tỉnh/thành phố';
      hasError = true;
    }
    if (!formData.districtCode) {
      errors.district = 'Vui lòng chọn quận/huyện';
      hasError = true;
    }
    if (!formData.wardCode) {
      errors.ward = 'Vui lòng chọn xã/phường/thị trấn';
      hasError = true;
    }
    if (!formData.address.trim()) {
      errors.address = 'Địa chỉ không được để trống';
      hasError = true;
    } else if (formData.address.trim().length > 255) {
      errors.address = 'Địa chỉ không được quá 255 ký tự';
      hasError = true;
    }

    // Validate note (optional but check max length)
    if (formData.note && formData.note.length > 500) {
      errors.note = 'Ghi chú không được quá 500 ký tự';
      hasError = true;
    }

    if (hasError) {
      setValidationErrors(errors);
      return false;
    }

    setValidationErrors({});
    return true;
  };

  const handleSubmit = async () => {
    // Prevent multiple submissions
    if (isProcessing) {
      return;
    }

    // Validate form
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Use hook to handle order submission
    // Note: isProcessing will be set to true inside the hook
    await handleOrderSubmit(formData, cartItems, discount, appliedCouponId);
  };

  const breadcrumbs = [
    { label: 'Trang chủ', path: '/' },
    { label: 'Giỏ hàng', path: '/cart' },
    { label: 'Thanh toán' },
  ];

  const handleCloseNotification = () => {
    setShowSuccessNotification(false);
    setIsErrorNotification(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8 ">
      {/* Header */}
      <CheckoutHeader breadcrumbs={breadcrumbs} />
      <div className="container mx-auto px-4 max-w-7xl">


        {/* Checkout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Shipping & Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Form */}
            <ShippingForm formData={formData} onUpdate={updateFormData} validationErrors={validationErrors} />

            {/* Coupon Select */}
            {isAuthenticated && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CouponSelect
                  coupons={coupons}
                  selectedCouponId={selectedCouponId}
                  userInfo={userInfo}
                  isLoading={isLoadingCoupons}
                  onSelectCoupon={handleSelectCoupon}
                />
              </motion.div>
            )}

            {/* Payment Methods */}
            <PaymentMethodSelector
              selectedMethod={formData.paymentMethod}
              onSelect={handlePaymentMethodChange}
              validationError={validationErrors.paymentMethod}
            />
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-1">
            <OrderSummary
              cartItems={cartItems}
              onSubmit={handleSubmit}
              isProcessing={isProcessing}
              showQRWarning={false}
              isPaymentConfirmed={false}
              discount={discount}
            />
          </div>
        </div>
      </div>

      {/* Notifications and Modals */}
      <CheckoutNotifications
        showSuccessNotification={showSuccessNotification}
        successMessage={successMessage}
        isErrorNotification={isErrorNotification}
        onClose={handleCloseNotification}
      />

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Checkout;
