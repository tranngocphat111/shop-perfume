import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { ShippingForm, PaymentMethodSelector, QRPayment, OrderSummary } from '../components/checkout';
import type { CheckoutFormData, OrderRequest } from '../types';
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
  const cartItems = cart.items;
  const [formData, setFormData] = useState<CheckoutFormData>(initialFormData);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems, navigate]);

  // Calculate total
  const total = cartItems.reduce(
    (sum, item) => sum + item.product.unitPrice * item.quantity,
    0
  );

  const updateFormData = (data: Partial<CheckoutFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handlePaymentMethodChange = (method: CheckoutFormData['paymentMethod']) => {
    updateFormData({ paymentMethod: method });
    setIsPaymentConfirmed(false);
  };

  const handleQRPaymentConfirmed = () => {
    setIsPaymentConfirmed(true);
  };

  const validateForm = (): boolean => {
    if (!formData.fullName.trim()) {
      setError('Vui lòng nhập họ và tên');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Vui lòng nhập số điện thoại');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Vui lòng nhập email');
      return false;
    }
    if (!formData.cityCode) {
      setError('Vui lòng chọn tỉnh/thành phố');
      return false;
    }
    if (!formData.districtCode) {
      setError('Vui lòng chọn quận/huyện');
      return false;
    }
    if (!formData.wardCode) {
      setError('Vui lòng chọn xã/phường/thị trấn');
      return false;
    }
    if (!formData.address.trim()) {
      setError('Vui lòng nhập địa chỉ cụ thể');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    // Validate form
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Check QR payment confirmation
    if (formData.paymentMethod === 'qr-payment' && !isPaymentConfirmed) {
      setError('Vui lòng hoàn tất thanh toán QR trước khi đặt hàng');
      return;
    }

    setIsProcessing(true);

    try {
      // Prepare order request
      const fullAddress = `${formData.address}, ${formData.ward}, ${formData.district}, ${formData.city}`;
      
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
        cartItems: cartItems,
        totalAmount: total,
      };

      // Submit order
      const response = await apiService.post('/api/orders/create', orderRequest);

      if (response) {
        // Clear cart
        clearCart();
        
        // Show success message
        setSuccess('Đặt hàng thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.');
        
        // Redirect to home after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (err: any) {
      console.error('Error placing order:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsProcessing(false);
    }
  };

  const showQRWarning = formData.paymentMethod === 'qr-payment' && !isPaymentConfirmed;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
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

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg animate-fadeIn">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg animate-fadeIn">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{success}</span>
            </div>
          </div>
        )}

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
            <ShippingForm formData={formData} onUpdate={updateFormData} />

            {/* Payment Methods */}
            <PaymentMethodSelector
              selectedMethod={formData.paymentMethod}
              onSelect={handlePaymentMethodChange}
              onQRPaymentSelect={() => setIsPaymentConfirmed(false)}
            />

            {/* QR Payment Details (if selected) */}
            {formData.paymentMethod === 'qr-payment' && (
              <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm">
                <QRPayment
                  amount={total}
                  onPaymentConfirmed={handleQRPaymentConfirmed}
                />
              </div>
            )}
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-1">
            <OrderSummary
              cartItems={cartItems}
              onSubmit={handleSubmit}
              isProcessing={isProcessing}
              showQRWarning={showQRWarning}
              isPaymentConfirmed={isPaymentConfirmed}
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

