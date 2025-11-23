package iuh.fit.server.services;

import iuh.fit.server.dto.request.OrderCreateRequest;
import iuh.fit.server.dto.response.OrderResponse;
import iuh.fit.server.dto.response.PaymentCheckResponse;

public interface OrderService {
    OrderResponse createOrder(OrderCreateRequest request);
    
    PaymentCheckResponse checkQRPayment(String orderId);
}

