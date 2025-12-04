package iuh.fit.server.services;

import iuh.fit.server.dto.request.OrderCreateRequest;
import iuh.fit.server.dto.request.SepayWebhookRequest;
import iuh.fit.server.dto.response.OrderResponse;
import iuh.fit.server.dto.response.PaymentCheckResponse;
import iuh.fit.server.dto.response.RevenueStatsResponse;

import java.util.List;

public interface OrderService {
    Long getSizeOfPendingOrders();

    Long getTotalSize();

    double getTotalRevenue();
    
    RevenueStatsResponse getRevenueStatsByPeriod(String period, Integer year);

    OrderResponse createOrder(OrderCreateRequest request);
    
    PaymentCheckResponse checkQRPayment(String orderId);
    PaymentCheckResponse checkQRPayment(String orderId, boolean debug);
    
    void cancelOrderIfTimeout(Integer orderId);
    
    boolean isOrderCancelled(Integer orderId);
    
    void cancelOrder(Integer orderId);
    
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
    
    /**
     * Get orders with pagination and search
     * @param pageable Pagination information
     * @param searchTerm Search term for filtering orders
     * @return Page of OrderResponse
     */
    org.springframework.data.domain.Page<OrderResponse> getOrdersPage(org.springframework.data.domain.Pageable pageable, String searchTerm);
    
    /**
     * Update shipment status for an order
     * @param orderId The order ID
     * @param status The new shipment status
     */
    void updateShipmentStatus(Integer orderId, String status);
    
    /**
     * Update payment status for an order
     * @param orderId The order ID
     * @param status The new payment status
     */
    void updatePaymentStatus(Integer orderId, String status);
}

