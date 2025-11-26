package iuh.fit.server.services;

import iuh.fit.server.dto.request.OrderCreateRequest;
import iuh.fit.server.dto.request.SepayWebhookRequest;
import iuh.fit.server.dto.response.OrderResponse;
import iuh.fit.server.dto.response.PaymentCheckResponse;

import java.util.List;

public interface OrderService {
    OrderResponse createOrder(OrderCreateRequest request);
    
    PaymentCheckResponse checkQRPayment(String orderId);
    PaymentCheckResponse checkQRPayment(String orderId, boolean debug);
    
    void cancelOrderIfTimeout(Integer orderId);
    
    boolean isOrderCancelled(Integer orderId);
    
    List<OrderResponse> getOrdersByEmail(String email);
    
    List<OrderResponse> getOrdersByUserId(Integer userId);
    
    /**
     * Process Sepay webhook callback and update payment status
     * @param webhookRequest The webhook request from Sepay
     * @return true if payment was successfully processed, false otherwise
     */
    boolean processSepayWebhook(SepayWebhookRequest webhookRequest);
    
    /**
     * Extract order ID from webhook request
     * @param webhookRequest The webhook request from Sepay
     * @return Order ID if found, null otherwise
     */
    Integer extractOrderIdFromWebhook(SepayWebhookRequest webhookRequest);
}

