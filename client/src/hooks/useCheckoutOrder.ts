import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { inventoryService } from '../services/inventory.service';
import { apiService } from '../services/api';
import { cartService } from '../services/cart.service';
import type { CheckoutFormData, OrderRequest, OrderResponse } from '../types';

interface UseCheckoutOrderReturn {
  isProcessing: boolean;
  validationErrors: Record<string, string>;
  showSuccessNotification: boolean;
  successMessage: { message: string; subMessage?: string } | null;
  isErrorNotification: boolean;
  handleSubmit: (formData: CheckoutFormData, cartItems: any[], discount: number, appliedCouponId: number | null) => Promise<void>;
  setShowSuccessNotification: (show: boolean) => void;
  setIsErrorNotification: (isError: boolean) => void;
  setValidationErrors: (errors: Record<string, string>) => void;
}

export const useCheckoutOrder = (): UseCheckoutOrderReturn => {
  const navigate = useNavigate();
  const { removeMultipleFromCart, refreshCartStock, cart } = useCart();
  const { user, isAuthenticated } = useAuth();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState<{ message: string; subMessage?: string } | null>(null);
  const [isErrorNotification, setIsErrorNotification] = useState(false);

  const handleSubmit = useCallback(async (
    formData: CheckoutFormData,
    cartItems: any[],
    discount: number,
    appliedCouponIdParam: number | null
  ) => {
    // Set loading state ngay từ đầu để disable nút và hiển thị loading
    setIsProcessing(true);
    
    // Biến flag để đánh dấu có nên dừng loading không - khai báo ở ngoài để có thể truy cập trong finally
    let shouldStopLoading = true;

    // Validate stock - Nếu có bất kỳ sản phẩm nào hết hàng hoặc không đủ hàng, reject toàn bộ đơn hàng
    try {
      const stockValidationErrors: string[] = [];
      
      for (const item of cartItems) {
        const availableStock = await inventoryService.getAvailableStock(item.product.productId);
        
        // Nếu hết hàng, reject toàn bộ đơn hàng
        if (availableStock === 0) {
          stockValidationErrors.push(
            `Sản phẩm "${item.product.name}" đã hết hàng.`
          );
        }
        // Nếu không đủ hàng, reject toàn bộ đơn hàng
        else if (availableStock < item.quantity) {
          stockValidationErrors.push(
            `Sản phẩm "${item.product.name}" không đủ hàng. Số lượng có sẵn: ${availableStock}, yêu cầu: ${item.quantity}`
          );
        }
      }

      // Nếu có bất kỳ lỗi nào về stock, reject toàn bộ đơn hàng
      if (stockValidationErrors.length > 0) {
        // Refresh cart stock to update quantities
        await refreshCartStock();
        
        setIsErrorNotification(true);
        setValidationErrors({
          stock: stockValidationErrors.join(' ')
        });
        setSuccessMessage({
          message: 'Không thể đặt hàng',
          subMessage: stockValidationErrors.join('\n')
        });
        setShowSuccessNotification(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setIsProcessing(false);
        return;
      }
    } catch (error) {
      console.error('Error validating stock:', error);
      setValidationErrors({
        stock: 'Không thể kiểm tra tồn kho. Vui lòng thử lại.'
      });
      setIsErrorNotification(true);
      setSuccessMessage({
        message: 'Lỗi kiểm tra tồn kho',
        subMessage: 'Không thể kiểm tra tồn kho. Vui lòng thử lại.'
      });
      setShowSuccessNotification(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsProcessing(false);
      return;
    }

    // Lưu formData và total để dùng khi check order sau timeout (khai báo ở ngoài try để có thể truy cập trong catch)
    const savedFormData = { ...formData };
    const savedTotal = cartItems.reduce(
      (sum, item) => sum + item.product.unitPrice * item.quantity,
      0
    );
    const savedDiscount = discount;

    try {
      // Prepare order request
      const fullAddress = `${formData.address}, ${formData.ward}, ${formData.district}, ${formData.city}`;

      // Map cartItems to the format expected by backend (tất cả items đã được validate stock)
      const mappedCartItems = cartItems.map(item => ({
        productId: item.product.productId,
        productName: item.product.name,
        unitPrice: item.product.unitPrice,
        imageUrl: item.product.images && item.product.images.length > 0
          ? item.product.images[0].url
          : '',
        quantity: item.quantity,
      }));

      // Tính total từ cartItems
      const total = savedTotal;
      const finalTotal = total - discount;

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
        totalAmount: finalTotal,
        couponId: appliedCouponIdParam || undefined,
      };

      // Submit order
      const response = await apiService.post<OrderResponse>('/orders/create', orderRequest);

      if (response) {
        // Show success notification
        setIsErrorNotification(false);
        setSuccessMessage({
          message: 'Đặt hàng thành công!',
          subMessage: `Đơn hàng #${response.orderId} đã được tạo`,
        });
        setShowSuccessNotification(true);

        // Refresh user info if points were used (coupon applied)
        if (appliedCouponIdParam) {
          // Dispatch event to refresh user info in Header
          window.dispatchEvent(new Event('refreshUserInfo'));
        }

        // Remove items khỏi cart ngay khi tạo đơn thành công (cho cả COD và QR)
        // Vì đơn hàng đã được tạo thành công, items đã được "reserve" cho đơn hàng này
        const productIdsToRemove = cartItems.map(item => item.product.productId);
        
        // Tính toán cart items còn lại trước khi remove (để sync với DB)
        const remainingCartItems = cart.items.filter(
          item => !productIdsToRemove.includes(item.product.productId)
        );
        
        // Nếu user đã đăng nhập, sync cart với DB TRƯỚC để đảm bảo DB được cập nhật đúng
        if (isAuthenticated && user?.userId) {
          const cartItemsToSync = remainingCartItems.map(item => ({
            productId: item.product.productId,
            quantity: item.quantity,
          }));
          
          // Sync với DB trước
          try {
            await cartService.syncCart(user.userId, cartItemsToSync);
            console.log('[useCheckoutOrder] ✅ Cart synced with DB after order creation');
          } catch (syncError) {
            console.error('[useCheckoutOrder] ❌ Error syncing cart with DB:', syncError);
            // Không fail order creation nếu sync lỗi - items sẽ được remove khỏi state
          }
        }
        
        // Sau đó mới remove items khỏi state (để UI được cập nhật)
        removeMultipleFromCart(productIdsToRemove);
        console.log('[useCheckoutOrder] ✅ Removed items from cart:', productIdsToRemove);

        // Navigate to payment page immediately with order information
        navigate('/payment', {
          state: {
            order: response,
            paymentMethod: formData.paymentMethod,
            totalAmount: finalTotal,
          },
          replace: true,
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

      // Handle stock out of stock errors (race condition) - CHỈ hiển thị khi có response từ backend
      const errorMessage = err.response?.data?.message || err.message || '';
      const isOutOfStockError = errorMessage.includes('không đủ hàng') || 
                                errorMessage.includes('hết hàng') ||
                                errorMessage.includes('Số lượng trong kho') ||
                                errorMessage.includes('Số lượng còn lại trong kho') ||
                                errorMessage.includes('đang được xử lý bởi đơn hàng khác') ||
                                errorMessage.includes('Lock wait timeout exceeded') ||
                                errorMessage.includes('Lock timeout');

      if (isOutOfStockError) {
        // Refresh cart stock (không block UI) để cập nhật số lượng mới nhất
        refreshCartStock().catch(console.error);
        
        // Show out of stock modal (blocks interaction)
        setIsErrorNotification(true);
        
        // Xác định thông báo phù hợp dựa trên loại lỗi
        let displayMessage = 'Sản phẩm đã hết hàng';
        let displaySubMessage = errorMessage || 'Sản phẩm bạn chọn đã được người khác đặt trước. Vui lòng kiểm tra lại giỏ hàng.';
        
        if (errorMessage.includes('đang được xử lý bởi đơn hàng khác')) {
          displayMessage = 'Sản phẩm đang được xử lý';
          displaySubMessage = 'Sản phẩm bạn chọn đang được người khác đặt hàng. Vui lòng kiểm tra lại số lượng hàng có sẵn.';
        } else if (errorMessage.includes('không đủ hàng') || errorMessage.includes('Số lượng còn lại')) {
          displayMessage = 'Sản phẩm không đủ hàng';
          displaySubMessage = errorMessage;
        } else if (errorMessage.includes('hết hàng')) {
          displayMessage = 'Sản phẩm đã hết hàng';
          displaySubMessage = errorMessage;
        }
        
        setSuccessMessage({
          message: displayMessage,
          subMessage: displaySubMessage,
        });
        setShowSuccessNotification(true);
        // Scroll chỉ khi có response từ backend (có lỗi thực sự)
        if (err.response?.data) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        // setIsProcessing(false) sẽ được gọi trong finally block
        return;
      }

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
          setValidationErrors({ _general: errorData.message });
        } else {
          setValidationErrors({});
        }
      } else {
        // For non-400 errors
        // QUAN TRỌNG: Kiểm tra timeout TRƯỚC - nếu timeout từ frontend (không có response), KHÔNG làm gì cả
        if (err.status === 408) {
          // Timeout từ frontend: không có response hoặc response không có data
          // Timeout từ backend: có response.data
          if (!err.response || !err.response.data) {
            // Timeout từ frontend - KHÔNG có response từ backend
            // Có thể request vẫn đang chạy ở backend và đã tạo đơn hàng
            // Check xem có đơn hàng nào đã được tạo chưa (trong vòng 2 phút gần đây)
            console.error('Frontend timeout - no response from backend, checking if order was created...');
            
            try {
              // Đợi thêm 5 giây để backend có thời gian hoàn thành request
              await new Promise(resolve => setTimeout(resolve, 5000));
              
              // Check xem có đơn hàng nào đã được tạo chưa
              const checkOrdersUrl = isAuthenticated && user 
                ? `/orders/my-orders` 
                : `/orders/my-orders?email=${encodeURIComponent(savedFormData.email)}`;
              
              const recentOrders = await apiService.get<OrderResponse[]>(checkOrdersUrl);
              
              // Tìm đơn hàng được tạo trong vòng 2 phút gần đây với cùng email và totalAmount
              const now = new Date();
              const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
              
              const matchingOrder = recentOrders?.find(order => {
                const orderDate = new Date(order.orderDate);
                const isRecent = orderDate >= twoMinutesAgo;
                const matchesEmail = order.guestEmail === savedFormData.email;
                const matchesAmount = Math.abs(order.totalAmount - (savedTotal - savedDiscount)) < 0.01;
                return isRecent && matchesEmail && matchesAmount;
              });
              
              if (matchingOrder) {
                // Đơn hàng đã được tạo thành công, chỉ là frontend timeout
                console.log('✅ Order was created successfully despite frontend timeout:', matchingOrder);
                
                // Show success notification
                setIsErrorNotification(false);
                setSuccessMessage({
                  message: 'Đặt hàng thành công!',
                  subMessage: `Đơn hàng #${matchingOrder.orderId} đã được tạo`,
                });
                setShowSuccessNotification(true);
                
                // Refresh user info if points were used
                if (appliedCouponIdParam) {
                  window.dispatchEvent(new Event('refreshUserInfo'));
                }
                
                // Remove items from cart (cho cả COD và QR)
                const productIdsToRemove = cartItems.map(item => item.product.productId);
                
                // Tính toán cart items còn lại
                const remainingCartItems = cart.items.filter(
                  item => !productIdsToRemove.includes(item.product.productId)
                );
                
                // Nếu user đã đăng nhập, sync cart với DB TRƯỚC
                if (isAuthenticated && user?.userId) {
                  const cartItemsToSync = remainingCartItems.map(item => ({
                    productId: item.product.productId,
                    quantity: item.quantity,
                  }));
                  
                  try {
                    await cartService.syncCart(user.userId, cartItemsToSync);
                    console.log('[useCheckoutOrder] ✅ Cart synced with DB after timeout order creation');
                  } catch (syncError) {
                    console.error('[useCheckoutOrder] ❌ Error syncing cart with DB:', syncError);
                  }
                }
                
                // Sau đó remove items khỏi state
                removeMultipleFromCart(productIdsToRemove);
                
                // Navigate to payment page
                navigate('/payment', {
                  state: {
                    order: matchingOrder,
                    paymentMethod: savedFormData.paymentMethod,
                    totalAmount: savedTotal - savedDiscount,
                  },
                  replace: true,
                });
                
                return; // Return sớm, đơn hàng đã được tạo thành công
              }
            } catch (checkError) {
              console.error('Error checking for existing order:', checkError);
              // Nếu không check được, tiếp tục xử lý như timeout bình thường
            }
            
            // Không tìm thấy đơn hàng - có thể request thực sự failed hoặc vẫn đang chờ
            // KHÔNG dừng loading - để nút tiếp tục loading cho đến khi có response
            console.error('No matching order found, request may still be processing (waiting for lock)');
            shouldStopLoading = false; // KHÔNG dừng loading
            return; // Return sớm, KHÔNG làm gì cả - nút tiếp tục loading
          } else {
            // Timeout từ backend - có response từ backend với status 408
            refreshCartStock().catch(console.error);
            setIsErrorNotification(true);
            setSuccessMessage({
              message: 'Request timeout',
              subMessage: 'Yêu cầu đặt hàng bị timeout. Có thể do hệ thống đang quá tải. Vui lòng thử lại sau vài phút.',
            });
            setShowSuccessNotification(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return; // Return sớm sau khi hiển thị modal timeout
          }
        }
        
        // Không phải timeout - xử lý các lỗi khác
        if (!err.response || !err.response.data) {
          // Không có response từ backend và không phải timeout
          // Có thể là network error hoặc đang chờ - KHÔNG scroll, chỉ log
          // KHÔNG dừng loading - để nút tiếp tục loading
          console.error('No response from backend - network error or request still processing');
          shouldStopLoading = false; // KHÔNG dừng loading
          return; // Return sớm, KHÔNG scroll, KHÔNG set error - nút tiếp tục loading
        }
        
        // Có response từ backend và không phải timeout - hiển thị lỗi thông thường
        const generalErrorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.';
        setValidationErrors({ _general: generalErrorMessage });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      
      // CHỈ scroll khi có validation errors (400) VÀ có response từ backend
      if (err.status === 400 && err.response?.data) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      // CHỈ dừng loading nếu không phải timeout từ frontend hoặc không có response
      // Nếu timeout từ frontend, nút sẽ tiếp tục loading cho đến khi có response từ backend
      if (shouldStopLoading !== false) {
        setIsProcessing(false);
      }
    }
  }, [navigate, removeMultipleFromCart, refreshCartStock, cart, isAuthenticated, user]);

  return {
    isProcessing,
    validationErrors,
    showSuccessNotification,
    successMessage,
    isErrorNotification,
    handleSubmit,
    setShowSuccessNotification,
    setIsErrorNotification,
    setValidationErrors,
  };
};

