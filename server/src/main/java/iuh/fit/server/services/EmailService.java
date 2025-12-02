package iuh.fit.server.services;

import iuh.fit.server.dto.ContactRequest;
import iuh.fit.server.model.entity.Order;

public interface EmailService {

    /**
     * Gửi email reset password
     * 
     * @param toEmail    Email người nhận
     * @param resetToken Token để reset password
     * @param resetUrl   URL để reset password (full URL với token)
     */
    void sendPasswordResetEmail(String toEmail, String resetToken, String resetUrl);

    /**
     * Gửi email xác nhận đơn hàng
     * 
     * @param order Đơn hàng đã được tạo
     */
    void sendOrderConfirmationEmail(Order order);

    /**
     * Gửi email liên hệ từ khách hàng đến chủ website
     * 
     * @param contactRequest Thông tin liên hệ
     */
    void sendContactEmail(ContactRequest contactRequest);
}
