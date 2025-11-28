package iuh.fit.server.services.impl;

import iuh.fit.server.model.entity.Order;
import iuh.fit.server.model.entity.Payment;
import iuh.fit.server.model.entity.User;
import iuh.fit.server.model.enums.Method;
import iuh.fit.server.model.enums.PaymentStatus;
import iuh.fit.server.repository.PaymentRepository;
import iuh.fit.server.repository.UserRepository;
import iuh.fit.server.services.CodAutoCompleteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;

/**
 * Service tự động hoàn thành thanh toán COD sau 5 phút
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CodAutoCompleteServiceImpl implements CodAutoCompleteService {

    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;

    /**
     * Tự động set các đơn COD thành công sau 5 phút
     * Chạy mỗi 1 phút để check
     */
    @Scheduled(fixedRate = 60000) // Chạy mỗi 60 giây (1 phút)
    @Transactional
    @Override
    public void autoCompleteCodOrders() {
        try {
            log.debug("🔄 Checking for COD orders to auto-complete...");
            
            // Tính thời gian 5 phút trước
            Date fiveMinutesAgo = new Date(System.currentTimeMillis() - (5 * 60 * 1000));
            
            // Tìm tất cả payments COD đang PENDING và order đã tạo trước 5 phút
            List<Payment> pendingCodPayments = paymentRepository.findPendingCodPaymentsBeforeDate(
                    Method.COD,
                    PaymentStatus.PENDING,
                    fiveMinutesAgo
            );
            
            if (pendingCodPayments.isEmpty()) {
                log.debug("✅ No COD orders to auto-complete");
                return;
            }
            
            log.info("📦 Found {} COD orders to auto-complete", pendingCodPayments.size());
            
            int completedCount = 0;
            for (Payment payment : pendingCodPayments) {
                try {
                    Order order = payment.getOrder();
                    if (order == null) continue;
                    
                    // Update payment status to PAID
                    payment.setStatus(PaymentStatus.PAID);
                    payment.setPaymentDate(new Date());
                    paymentRepository.save(payment);
                    
                    log.info("✅ Auto-completed COD order: Order ID = {}, Payment ID = {}", 
                            order.getOrderId(), payment.getPaymentId());
                    
                    // Tích điểm cho user khi đơn hàng COD được thanh toán
                    // Quy tắc: 1 điểm = 10,000 VND
                    if (order.getUser() != null) {
                        try {
                            User user = order.getUser();
                            int pointsToAdd = (int) Math.floor(order.getTotalAmount() / 10000.0);
                            int newPoints = user.getLoyaltyPoints() + pointsToAdd;
                            user.setLoyaltyPoints(newPoints);
                            userRepository.save(user);
                            
                            log.info("🎁 Added {} points to user {} (total: {} points) after COD order {}", 
                                    pointsToAdd, user.getUserId(), newPoints, order.getOrderId());
                        } catch (Exception e) {
                            log.error("❌ Error adding loyalty points for order {}", order.getOrderId(), e);
                            // Don't fail the payment if points adding fails
                        }
                    }
                    
                    completedCount++;
                } catch (Exception e) {
                    log.error("❌ Error auto-completing COD payment: Payment ID = {}", 
                            payment.getPaymentId(), e);
                }
            }
            
            log.info("🎉 Auto-completed {} COD orders", completedCount);
            
        } catch (Exception e) {
            log.error("❌ Error in autoCompleteCodOrders scheduled task", e);
        }
    }
}

