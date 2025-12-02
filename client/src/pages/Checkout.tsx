import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { ShippingForm, PaymentMethodSelector, OrderSummary } from '../components/checkout';
import { SuccessNotification } from '../components/common';
import { CouponSelect } from '../components/checkout/CouponSelect';
import { couponService, type Coupon } from '../services/coupon.service';
import { userService, type UserInfo } from '../services/user.service';
import { inventoryService } from '../services/inventory.service';
import type { CheckoutFormData, OrderRequest, OrderResponse } from '../types';
import { apiService } from '../services/api';

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
  const { cart, clearCart, appliedCouponId, discount, setAppliedCouponId, setDiscount, updateQuantity, removeFromCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  
  // Filter out of stock items ngay từ đầu - chỉ lấy items còn hàng
  const cartItems = cart.items.filter(item => 
    item.stockQuantity === undefined || item.stockQuantity > 0
  );
  const [formData, setFormData] = useState<CheckoutFormData>(initialFormData);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState<{ message: string; subMessage?: string } | null>(null);
  
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
    // This prevents redirect when navigating to payment page
    if (cartItems.length === 0 && window.location.pathname === '/checkout') {
      navigate('/cart');
    }
  }, [cartItems, navigate]);

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
    setValidationErrors(prev => {
      const newErrors = { ...prev };
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

      return newErrors;
    });
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
    // Validate form
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validate stock và filter out of stock items before submitting
    let filteredCartItems = [...cartItems];
    try {
      const stockValidationErrors: string[] = [];
      const validCartItems = [];
      
      for (const item of cartItems) {
        const availableStock = await inventoryService.getAvailableStock(item.product.productId);
        
        // Nếu hết hàng, bỏ qua item này (KHÔNG xóa khỏi cart, chỉ bỏ qua khi submit order)
        if (availableStock === 0) {
          stockValidationErrors.push(
            `Sản phẩm "${item.product.name}" đã hết hàng và đã được loại bỏ khỏi đơn hàng.`
          );
          // KHÔNG xóa khỏi cart - chỉ bỏ qua khi submit order
          continue;
        }
        
        // Nếu không đủ hàng, điều chỉnh quantity
        if (availableStock < item.quantity) {
          stockValidationErrors.push(
            `Sản phẩm "${item.product.name}" không đủ hàng. Số lượng có sẵn: ${availableStock}, đã điều chỉnh từ ${item.quantity} xuống ${availableStock}`
          );
          // Cập nhật quantity trong cart
          updateQuantity(item.product.productId, availableStock);
          // Thêm item với quantity đã điều chỉnh
          validCartItems.push({ ...item, quantity: availableStock });
        } else {
          // Đủ hàng, thêm bình thường
          validCartItems.push(item);
        }
      }

      // Nếu có items bị loại bỏ hoặc điều chỉnh
      if (stockValidationErrors.length > 0 || validCartItems.length !== cartItems.length) {
        if (validCartItems.length === 0) {
          setValidationErrors({
            stock: 'Tất cả sản phẩm trong giỏ hàng đã hết hàng. Vui lòng chọn sản phẩm khác.'
          });
          setSuccessMessage({
            message: 'Không thể đặt hàng',
            subMessage: 'Tất cả sản phẩm trong giỏ hàng đã hết hàng.'
          });
          setShowSuccessNotification(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setIsProcessing(false);
          return;
        }

        // Hiển thị thông báo về các items bị loại bỏ/điều chỉnh
        setSuccessMessage({
          message: 'Đã cập nhật giỏ hàng',
          subMessage: stockValidationErrors.join('\n')
        });
        setShowSuccessNotification(true);
        
        // Sử dụng validCartItems cho order
        filteredCartItems = validCartItems;
      }
    } catch (error) {
      console.error('Error validating stock:', error);
      // Continue with order creation if stock validation fails (backend will also validate)
    }

    setIsProcessing(true);

    try {
      // Prepare order request
      const fullAddress = `${formData.address}, ${formData.ward}, ${formData.district}, ${formData.city}`;

      // Map filteredCartItems to the format expected by backend (đã loại bỏ items hết hàng)
      const mappedCartItems = filteredCartItems.map(item => ({
        productId: item.product.productId,
        productName: item.product.name,
        unitPrice: item.product.unitPrice,
        imageUrl: item.product.images && item.product.images.length > 0
          ? item.product.images[0].url
          : '',
        quantity: item.quantity,
      }));

      // Tính lại total từ filteredCartItems
      const filteredTotal = filteredCartItems.reduce(
        (sum, item) => sum + item.product.unitPrice * item.quantity,
        0
      );
      const finalTotal = filteredTotal - discount;

      const orderRequest: OrderRequest = {
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        city: formData.city,
        district: formData.district,
        ward: formData.ward,
        address: fullAddress,
        note: formData.note || '',
        paymentMethod: formData.paymentMethod,
        cartItems: mappedCartItems,
        totalAmount: finalTotal, // Tính từ filteredCartItems và trừ discount
        couponId: appliedCouponId || undefined, // Gửi couponId nếu có
      };

      // Submit order - fix path (API_BASE_URL already includes /api)
      const response = await apiService.post<OrderResponse>('/orders/create', orderRequest);

      if (response) {
        // Show success notification
        setSuccessMessage({
          message: 'Đặt hàng thành công!',
          subMessage: `Đơn hàng #${response.orderId} đã được tạo`,
        });
        setShowSuccessNotification(true);

        // Refresh user info if points were used (coupon applied)
        if (appliedCouponId) {
          // Dispatch event to refresh user info in Header
          window.dispatchEvent(new Event('refreshUserInfo'));
        }

        // Lưu thông tin order items để remove sau khi payment thành công (cho QR payment)
        const orderItemsToRemove = filteredCartItems.map(item => item.product.productId);
        
        // Nếu là COD, remove items ngay (vì COD = thanh toán khi nhận hàng, order được tạo = đã chấp nhận)
        if (formData.paymentMethod === 'cod') {
          // Remove các items đã submit (chỉ items còn hàng, không remove items hết hàng)
          filteredCartItems.forEach(item => {
            removeFromCart(item.product.productId);
          });
        } else {
          // QR payment: lưu để remove sau khi payment PAID
          localStorage.setItem(`pending_order_${response.orderId}`, JSON.stringify(orderItemsToRemove));
        }

        // Navigate to payment page immediately with order information
        navigate('/payment', {
          state: {
            order: response,
            paymentMethod: formData.paymentMethod,
            totalAmount: total,
          },
          replace: true, // Replace current history to prevent back button issues
        });
      }
    } catch (err: any) {
      console.error('Error placing order:', err);
      console.error('Error details:', {
        status: err.status,
        response: err.response,
        errorData: err.response?.data,
        errors: err.response?.data?.errors,
      });

      // Handle validation errors from backend
      if (err.status === 400) {
        const errorData = err.response?.data || err;
        console.log('Processing validation errors:', errorData);

        if (errorData.errors && typeof errorData.errors === 'object') {
          // Map backend field names to frontend field names if needed
          const mappedErrors: Record<string, string> = {};
          const cartItemsErrors: string[] = [];

          // Process all errors from backend
          Object.entries(errorData.errors).forEach(([field, message]) => {
            const errorMessage = Array.isArray(message) ? message[0] : message;

            // Handle nested errors from cartItems (e.g., cartItems[0].unitPrice)
            if (field.startsWith('cartItems')) {
              // Extract the actual field name from nested path (e.g., "unitPrice" from "cartItems[0].unitPrice")
              const nestedField = field.includes('.') ? field.split('.').pop() : field;
              const fieldLabels: Record<string, string> = {
                productId: 'Mã sản phẩm',
                productName: 'Tên sản phẩm',
                unitPrice: 'Giá sản phẩm',
                quantity: 'Số lượng',
                imageUrl: 'Hình ảnh',
              };
              const fieldLabel = fieldLabels[nestedField || ''] || nestedField || 'Sản phẩm';
              cartItemsErrors.push(`${fieldLabel}: ${errorMessage}`);
            } else {
              // Map field names from backend to frontend if needed
              // Backend uses: fullName, phone, email, city, district, ward, address, note, paymentMethod
              // Frontend uses the same names, so direct mapping
              mappedErrors[field] = errorMessage as string;
            }
          });

          console.log('Mapped errors:', mappedErrors);

          // Store cartItems errors separately for better display
          if (cartItemsErrors.length > 0) {
            mappedErrors._cartItemsArray = JSON.stringify(cartItemsErrors);
          }

          setValidationErrors(mappedErrors);
        } else if (errorData.message) {
          // If there's a general error message but no field-specific errors
          console.log('General error message:', errorData.message);
          // You might want to show this in a toast or alert
          setValidationErrors({ _general: errorData.message });
        } else {
          setValidationErrors({});
        }
      } else {
        // For non-400 errors, show general error
        const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.';
        setValidationErrors({ _general: errorMessage });
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsProcessing(false);
    }
  };

  const breadcrumbs = [
    { label: 'Trang chủ', path: '/' },
    { label: 'Giỏ hàng', path: '/cart' },
    { label: 'Thanh toán' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-8 ">
      {/* Header */}
      <motion.div
        className="bg-white rounded-lg shadow-sm py-16 px-6 mb-6"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="text-center">
          <motion.h1
            className="text-3.5xl md:text-4.5xl lg:text-5.5xl font-normal text-black mb-4 leading-tight tracking-tight"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          >
            Thanh toán
          </motion.h1>

          {/* Breadcrumb */}
          <motion.nav
            className="text-sm md:text-base flex items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {breadcrumbs.map((item, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
              >
                {item.path ? (
                  <Link
                    to={item.path}
                    className="text-gray-600 font-normal hover:text-black transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-black font-medium text-base md:text-lg">{item.label}</span>
                )}
                {index < breadcrumbs.length - 1 && (
                  <span className="text-black">{'>'}</span>
                )}
              </motion.div>
            ))}
          </motion.nav>
        </div>
      </motion.div>
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

      {/* Success Notification */}
      {showSuccessNotification && successMessage && (
        <SuccessNotification
          message={successMessage.message}
          subMessage={successMessage.subMessage}
          onClose={() => setShowSuccessNotification(false)}
        />
      )}

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
