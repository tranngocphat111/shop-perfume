package iuh.fit.server.services.impl;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.SendEmailRequest;
import com.resend.services.emails.model.SendEmailResponse;
import iuh.fit.server.dto.ContactRequest;
import iuh.fit.server.email.templates.PasswordResetEmailTemplate;
import iuh.fit.server.email.templates.WelcomeEmailTemplate;
import iuh.fit.server.model.entity.Order;
import iuh.fit.server.model.enums.Method;
import iuh.fit.server.model.enums.PaymentStatus;
import iuh.fit.server.services.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final PasswordResetEmailTemplate passwordResetEmailTemplate;
    private final WelcomeEmailTemplate welcomeEmailTemplate;
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${resend.api-key}")
    private String resendApiKey;

    @Value("${resend.from-email}")
    private String fromEmail;

    @Value("${app.frontend.url:${FRONTEND_URL:http://localhost:3000}}")
    private String frontendUrl;

    /**
     * Lấy URL frontend đầu tiên nếu có nhiều URL được nối với nhau (ví dụ:
     * "url1,url2")
     * Hỗ trợ chuyển đổi giữa localhost và production dễ dàng
     */
    private String getFrontendUrl() {
        if (frontendUrl == null || frontendUrl.isEmpty()) {
            log.warn("FRONTEND_URL not configured, using default http://localhost:3000");
            return "http://localhost:3000";
        }
        String cleaned = frontendUrl.replace("`", "").replace("\"", "").trim();
        log.info("Using FRONTEND_URL: {}", cleaned);
        String url = cleaned.split(",")[0].trim();
        return url;
    }

    @Value("${spring.mail.from:noreply@shopperfumestnp.dev}")
    private String mailFrom;

    @Override
    public void sendPasswordResetEmail(String toEmail, String resetToken, String resetUrl) {
        log.info("Attempting to send password reset email to: {}", toEmail);
        log.info("Using Resend API, From Email: {}", fromEmail);

        try {
            // Validate required configuration
            if (resendApiKey == null || resendApiKey.isEmpty()) {
                throw new IllegalStateException(
                        "RESEND_API_KEY is not configured. Please set it in environment variables.");
            }
            if (fromEmail == null || fromEmail.isEmpty()) {
                throw new IllegalStateException(
                        "RESEND_FROM_EMAIL is not configured. Please set it in environment variables.");
            }

            Resend resend = new Resend(resendApiKey);

            // Build reset URL with frontend domain
            // Sử dụng getFrontendUrl() để lấy URL đầu tiên (hỗ trợ chuyển đổi
            // localhost/production)
            String fullResetUrl = resetUrl;
            if (!resetUrl.startsWith("http")) {
                fullResetUrl = getFrontendUrl() + resetUrl;
            }

            String subject = passwordResetEmailTemplate.getSubject(fullResetUrl);
            String htmlBody = passwordResetEmailTemplate.buildHtml(fullResetUrl);
            String textBody = passwordResetEmailTemplate.buildText(fullResetUrl);

            log.debug("Building email request for destination: {}", toEmail);
            log.debug("Reset URL: {}", fullResetUrl);

            // Create email using Resend API 2.1.0
            SendEmailRequest emailRequest = SendEmailRequest.builder()
                    .from(fromEmail)
                    .to(toEmail)
                    .subject(subject)
                    .html(htmlBody)
                    .text(textBody)
                    .build();

            SendEmailResponse response;
            try {
                response = resend.emails().send(emailRequest);
            } catch (ResendException resendEx) {
                throw resendEx; // Re-throw to be caught by outer catch block
            }
            String emailId = response.getId();

            log.info("✅ Password reset email sent successfully!");
            log.info("   - To: {}", toEmail);
            log.info("   - Email ID: {}", emailId);
            log.info("   - From: {}", fromEmail);

        } catch (ResendException resendEx) {
            // Handle Resend API specific errors
            log.error("❌ Resend API Error sending password reset email to {}: {}", toEmail, resendEx.getMessage());

            String errorMessage = "Không thể gửi email đặt lại mật khẩu: " + resendEx.getMessage();

            // Check for common error messages
            String msg = resendEx.getMessage().toLowerCase();
            if (msg.contains("unauthorized") || msg.contains("401")) {
                errorMessage = "API Key không hợp lệ. Vui lòng kiểm tra RESEND_API_KEY.";
            } else if (msg.contains("forbidden") || msg.contains("403")) {
                errorMessage = "Domain chưa được verify trong Resend. Vui lòng verify domain: "
                        + fromEmail.split("@")[1];
            } else if (msg.contains("validation") || msg.contains("422")) {
                errorMessage = "Email không hợp lệ hoặc domain chưa được cấu hình đúng.";
            } else if (msg.contains("rate limit") || msg.contains("429")) {
                errorMessage = "Đã vượt quá giới hạn gửi email. Vui lòng thử lại sau.";
            }

            throw new RuntimeException(errorMessage, resendEx);

        } catch (Exception e) {

            // Handle configuration errors
            if (e instanceof IllegalStateException) {
                log.error("❌ Configuration error: {}", e.getMessage());
                throw e;
            }

            // Handle other unexpected errors
            log.error("❌ Unexpected error sending password reset email to {}: {}", toEmail, e.getMessage(), e);
            log.error("   - Exception Type: {}", e.getClass().getName());
            throw new RuntimeException("Không thể gửi email đặt lại mật khẩu: " + e.getMessage(), e);
        }
    }

    @Override
    public void sendOrderConfirmationEmail(Order order) {
        try {
            // Xác định email người nhận
            String toEmail;
            String customerName;

            if (order.getUser() != null) {
                // User đã đăng nhập
                toEmail = order.getUser().getEmail();
                customerName = order.getUser().getName();
            } else {
                // Guest order
                toEmail = order.getGuestEmail();
                customerName = order.getGuestName();
            }

            if (toEmail == null || toEmail.isEmpty()) {
                log.warn("⚠️ [sendOrderConfirmationEmail] No email address found for order {}", order.getOrderId());
                return;
            }

            log.info("📧 [sendOrderConfirmationEmail] Sending order confirmation email to: {}", toEmail);

            // Tạo context cho Thymeleaf template
            Context context = new Context(new Locale("vi", "VN"));
            context.setVariable("order", order);
            context.setVariable("customerName", customerName);
            context.setVariable("orderItems", order.getOrderItems());
            context.setVariable("orderDate", formatDate(order.getOrderDate()));
            context.setVariable("totalAmount", formatCurrency(order.getTotalAmount()));
            context.setVariable("paymentMethod", getPaymentMethodLabel(order.getPayment().getMethod()));
            context.setVariable("paymentStatus", getPaymentStatusLabel(order.getPayment().getStatus()));
            context.setVariable("orderId", order.getOrderId());

            // Địa chỉ giao hàng (sử dụng guestAddress từ Order)
            String deliveryAddress = order.getGuestAddress() != null ? order.getGuestAddress() : "Chưa có địa chỉ";
            context.setVariable("deliveryAddress", deliveryAddress);

            // Process template
            String htmlContent = templateEngine.process("email/order-confirmation", context);

            // Tạo email message
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(mailFrom);
            helper.setTo(toEmail);
            helper.setSubject("Xác nhận đơn hàng #" + order.getOrderId() + " - Shop Perfume");
            helper.setText(htmlContent, true);

            // Gửi email
            mailSender.send(message);

            log.info("✅ [sendOrderConfirmationEmail] Order confirmation email sent successfully to: {}", toEmail);

        } catch (MessagingException e) {
            log.error("❌ [sendOrderConfirmationEmail] Error sending order confirmation email for order {}: {}",
                    order.getOrderId(), e.getMessage(), e);
            // Không throw exception để không làm gián đoạn quá trình tạo đơn hàng
        } catch (Exception e) {
            log.error(
                    "❌ [sendOrderConfirmationEmail] Unexpected error sending order confirmation email for order {}: {}",
                    order.getOrderId(), e.getMessage(), e);
            // Không throw exception để không làm gián đoạn quá trình tạo đơn hàng
        }
    }

    private String formatDate(Date date) {
        if (date == null)
            return "";
        SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy HH:mm", new Locale("vi", "VN"));
        return sdf.format(date);
    }

    private String formatCurrency(double amount) {
        NumberFormat formatter = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));
        return formatter.format(amount).replace("₫", "₫");
    }

    private String getPaymentMethodLabel(Method method) {
        if (method == null)
            return "Chưa xác định";
        switch (method) {
            case COD:
                return "Thanh toán khi nhận hàng (COD)";
            case QR_CODE:
                return "Thanh toán qua QR Code";
            default:
                return method.name();
        }
    }

    private String getPaymentStatusLabel(PaymentStatus status) {
        if (status == null)
            return "Chưa xác định";
        switch (status) {
            case PENDING:
                return "Đang chờ thanh toán";
            case PAID:
                return "Đã thanh toán";
            case FAILED:
                return "Thanh toán thất bại";
            default:
                return status.name();
        }
    }

    @Override
    @Async("emailTaskExecutor")
    public void sendContactEmail(ContactRequest contactRequest) {
        try {
            log.info("📧 [sendContactEmail] Sending contact email from: {} - Subject: {}",
                    contactRequest.getEmail(), contactRequest.getSubject());

            // Tạo email message
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            // Email gửi từ khách hàng đến admin
            helper.setFrom(mailFrom);
            helper.setTo("h.sangg.r@gmail.com"); // Email chủ website
            helper.setReplyTo(contactRequest.getEmail()); // Reply về email khách hàng
            helper.setSubject("Liên hệ từ khách hàng: " + contactRequest.getSubject());

            // Tạo nội dung email HTML
            StringBuilder htmlContent = new StringBuilder();
            htmlContent.append("<!DOCTYPE html>");
            htmlContent.append("<html>");
            htmlContent.append("<head>");
            htmlContent.append("<meta charset='UTF-8'>");
            htmlContent.append("<style>");
            htmlContent.append("body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }");
            htmlContent.append(".container { max-width: 600px; margin: 0 auto; padding: 20px; }");
            htmlContent.append(".header { background-color: #000; color: #fff; padding: 20px; text-align: center; }");
            htmlContent.append(
                    ".content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }");
            htmlContent.append(".field { margin-bottom: 15px; }");
            htmlContent.append(".label { font-weight: bold; color: #555; }");
            htmlContent.append(
                    ".value { margin-top: 5px; padding: 10px; background-color: #fff; border-left: 3px solid #000; }");
            htmlContent.append(
                    ".footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #777; font-size: 12px; }");
            htmlContent.append("</style>");
            htmlContent.append("</head>");
            htmlContent.append("<body>");
            htmlContent.append("<div class='container'>");
            htmlContent.append("<div class='header'>");
            htmlContent.append("<h2>Tin nhắn liên hệ mới</h2>");
            htmlContent.append("</div>");
            htmlContent.append("<div class='content'>");

            htmlContent.append("<div class='field'>");
            htmlContent.append("<div class='label'>Họ và tên:</div>");
            htmlContent.append("<div class='value'>").append(contactRequest.getName()).append("</div>");
            htmlContent.append("</div>");

            htmlContent.append("<div class='field'>");
            htmlContent.append("<div class='label'>Email:</div>");
            htmlContent.append("<div class='value'>").append(contactRequest.getEmail()).append("</div>");
            htmlContent.append("</div>");

            htmlContent.append("<div class='field'>");
            htmlContent.append("<div class='label'>Số điện thoại:</div>");
            htmlContent.append("<div class='value'>").append(contactRequest.getPhone()).append("</div>");
            htmlContent.append("</div>");

            htmlContent.append("<div class='field'>");
            htmlContent.append("<div class='label'>Chủ đề:</div>");
            htmlContent.append("<div class='value'>").append(contactRequest.getSubject()).append("</div>");
            htmlContent.append("</div>");

            htmlContent.append("<div class='field'>");
            htmlContent.append("<div class='label'>Nội dung:</div>");
            htmlContent.append("<div class='value'>").append(contactRequest.getMessage().replace("\n", "<br>"))
                    .append("</div>");
            htmlContent.append("</div>");

            htmlContent.append("</div>");
            htmlContent.append("<div class='footer'>");
            htmlContent.append("<p>Email này được gửi từ form liên hệ trên website Shop Perfume</p>");
            htmlContent.append("<p>Vui lòng click 'Reply' để trả lời trực tiếp cho khách hàng</p>");
            htmlContent.append("</div>");
            htmlContent.append("</div>");
            htmlContent.append("</body>");
            htmlContent.append("</html>");

            helper.setText(htmlContent.toString(), true);

            // Gửi email
            mailSender.send(message);

            log.info("✅ [sendContactEmail] Contact email sent successfully to admin from: {}",
                    contactRequest.getEmail());

        } catch (MessagingException e) {
            log.error("❌ [sendContactEmail] Error sending contact email from {}: {}",
                    contactRequest.getEmail(), e.getMessage(), e);
            throw new RuntimeException("Không thể gửi email liên hệ. Vui lòng thử lại sau.", e);
        } catch (Exception e) {
            log.error("❌ [sendContactEmail] Unexpected error sending contact email from {}: {}",
                    contactRequest.getEmail(), e.getMessage(), e);
            throw new RuntimeException("Có lỗi xảy ra khi gửi email. Vui lòng thử lại sau.", e);
        }
    }

    @Override
    public void sendWelcomeEmail(String toEmail, String name) {
        try {
            if (toEmail == null || toEmail.isEmpty()) {
                log.warn("⚠️ [sendWelcomeEmail] No email provided, skip sending welcome email");
                return;
            }

            log.info("📧 [sendWelcomeEmail] Sending welcome email to: {}", toEmail);

            // Use WelcomeEmailTemplate (component) to build content
            String subject = welcomeEmailTemplate.getSubject(getFrontendUrl(), name);
            String htmlContent = welcomeEmailTemplate.buildHtml(getFrontendUrl(), name);
            String textContent = welcomeEmailTemplate.buildText(getFrontendUrl(), name);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(mailFrom);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);

            log.info("✅ [sendWelcomeEmail] Welcome email sent successfully to: {}", toEmail);
        } catch (MessagingException e) {
            log.error("❌ [sendWelcomeEmail] Error sending welcome email to {}: {}", toEmail, e.getMessage(), e);
            // Don't throw - don't break registration
        } catch (Exception e) {
            log.error("❌ [sendWelcomeEmail] Unexpected error sending welcome email to {}: {}", toEmail, e.getMessage(), e);
            // Don't throw
        }
    }

}
