import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { ShippingForm, PaymentMethodSelector, OrderSummary } from '../components/checkout';
import { Breadcrumb, SuccessNotification } from '../components/common';
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
  const { cart, clearCart, appliedUserCouponId, discount } = useCart();
  const { user, isAuthenticated } = useAuth();
  const cartItems = cart.items;
  const [formData, setFormData] = useState<CheckoutFormData>(initialFormData);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState<{ message: string; subMessage?: string } | null>(null);

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

    setIsProcessing(true);

    try {
      // Prepare order request
      const fullAddress = `${formData.address}, ${formData.ward}, ${formData.district}, ${formData.city}`;
      
      // Map cartItems to the format expected by backend
      const mappedCartItems = cartItems.map(item => ({
        productId: item.product.productId,
        productName: item.product.name,
        unitPrice: item.product.unitPrice,
        imageUrl: item.product.images && item.product.images.length > 0 
          ? item.product.images[0].url 
          : '',
        quantity: item.quantity,
      }));
      
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
        totalAmount: total - discount, // Trừ đi discount
        userCouponId: appliedUserCouponId || undefined, // Gửi userCouponId nếu có
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
        
        // Navigate to payment page immediately with order information
        // Clear cart after navigation to avoid redirect to empty cart
        navigate('/payment', {
          state: {
            order: response,
            paymentMethod: formData.paymentMethod,
            totalAmount: total,
          },
          replace: true, // Replace current history to prevent back button issues
        });
        
        // Clear cart after navigation
        setTimeout(() => {
          clearCart();
        }, 100);
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

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Trang chủ', path: '/' },
            { label: 'Giỏ hàng', path: '/cart' },
            { label: 'Thanh toán' },
          ]}
        />

        {/* Page Title */}
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Thanh toán</h1>
        <p className="text-gray-600 mb-8">
          Vui lòng điền đầy đủ thông tin để hoàn tất đơn hàng
        </p>

        {/* Checkout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Shipping & Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Form */}
            <ShippingForm formData={formData} onUpdate={updateFormData} validationErrors={validationErrors} />

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
