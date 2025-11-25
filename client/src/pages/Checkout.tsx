import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { ShippingForm, PaymentMethodSelector, OrderSummary } from '../components/checkout';
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
  const { cart, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const cartItems = cart.items;
  const [formData, setFormData] = useState<CheckoutFormData>(initialFormData);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
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

    if (!formData.fullName.trim()) {
      errors.fullName = 'Họ và tên không được để trống';
      hasError = true;
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Số điện thoại không được để trống';
      hasError = true;
    }
    if (!formData.email.trim()) {
      errors.email = 'Email không được để trống';
      hasError = true;
    }
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
        totalAmount: total,
      };

      // Submit order - fix path (API_BASE_URL already includes /api)
      const response = await apiService.post<OrderResponse>('/orders/create', orderRequest);

      if (response) {
        // Clear cart
        clearCart();
        
        // Navigate to payment page with order information
        navigate('/payment', {
          state: {
            order: response,
            paymentMethod: formData.paymentMethod,
            totalAmount: total,
          },
        });
      }
    } catch (err: any) {
      console.error('Error placing order:', err);
      
      // Handle validation errors from backend
      if (err.status === 400) {
        const errorData = err.response?.data || err;
        if (errorData.errors && typeof errorData.errors === 'object') {
          // Map backend field names to frontend field names if needed
          const mappedErrors: Record<string, string> = {};
          const cartItemsErrors: string[] = [];
          
          Object.entries(errorData.errors).forEach(([field, message]) => {
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
              cartItemsErrors.push(`${fieldLabel}: ${message}`);
            } else {
              mappedErrors[field] = message as string;
            }
          });
          
          // Store cartItems errors separately for better display
          // Store as array in a special format for rendering
          if (cartItemsErrors.length > 0) {
            // Use a special separator that we can split later
            mappedErrors._cartItemsArray = JSON.stringify(cartItemsErrors);
          }
          
          setValidationErrors(mappedErrors);
        } else {
          setValidationErrors({});
        }
      } else {
        setValidationErrors({});
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
        <nav className="mb-6 text-sm">
          <ol className="flex items-center space-x-2 text-gray-600">
            <li>
              <button
                onClick={() => navigate('/')}
                className="hover:text-black transition-colors"
              >
                Trang chủ
              </button>
            </li>
            <li>/</li>
            <li>
              <button
                onClick={() => navigate('/cart')}
                className="hover:text-black transition-colors"
              >
                Giỏ hàng
              </button>
            </li>
            <li>/</li>
            <li className="text-black font-medium">Thanh toán</li>
          </ol>
        </nav>


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
            />
          </div>
        </div>
      </div>

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
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Checkout;

