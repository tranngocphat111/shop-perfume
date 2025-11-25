package iuh.fit.server.services;

import iuh.fit.server.dto.request.OrderCreateRequest;
import iuh.fit.server.dto.response.OrderResponse;
import iuh.fit.server.dto.response.PaymentCheckResponse;

import java.util.List;

public interface OrderService {
    OrderResponse createOrder(OrderCreateRequest request);
    
    PaymentCheckResponse checkQRPayment(String orderId);
    
    void cancelOrderIfTimeout(Integer orderId);
    
    boolean isOrderCancelled(Integer orderId);
    
    List<OrderResponse> getOrdersByEmail(String email);
    
    List<OrderResponse> getOrdersByUserId(Integer userId);
}

