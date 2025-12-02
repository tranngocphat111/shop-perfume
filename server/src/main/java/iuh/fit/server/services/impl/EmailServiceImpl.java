package iuh.fit.server.services.impl;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
// Note: SendEmailRequest and SendEmailResponse may not be available at compile time
// Using reflection as fallback for compatibility
// import com.resend.services.emails.model.SendEmailRequest;
// import com.resend.services.emails.model.SendEmailResponse;
import iuh.fit.server.email.templates.PasswordResetEmailTemplate;
import iuh.fit.server.services.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {
    
    private final PasswordResetEmailTemplate passwordResetEmailTemplate;
    
    @Value("${resend.api-key}")
    private String resendApiKey;
    
    @Value("${resend.from-email}")
    private String fromEmail;
    
    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;
    
    @Override
    public void sendPasswordResetEmail(String toEmail, String resetToken, String resetUrl) {
        log.info("Attempting to send password reset email to: {}", toEmail);
        log.info("Using Resend API, From Email: {}", fromEmail);
        
        try {
            // Validate required configuration
            if (resendApiKey == null || resendApiKey.isEmpty()) {
                throw new IllegalStateException("RESEND_API_KEY is not configured. Please set it in environment variables.");
            }
            if (fromEmail == null || fromEmail.isEmpty()) {
                throw new IllegalStateException("RESEND_FROM_EMAIL is not configured. Please set it in environment variables.");
            }
            
            Resend resend = new Resend(resendApiKey);
            
            // Build reset URL with frontend domain
            String fullResetUrl = resetUrl;
            if (!resetUrl.startsWith("http")) {
                fullResetUrl = frontendUrl + resetUrl;
            }
            
            String subject = passwordResetEmailTemplate.getSubject(fullResetUrl);
            String htmlBody = passwordResetEmailTemplate.buildHtml(fullResetUrl);
            String textBody = passwordResetEmailTemplate.buildText(fullResetUrl);
            
            log.debug("Building email request for destination: {}", toEmail);
            log.debug("Reset URL: {}", fullResetUrl);
            
            // Use reflection to call Resend API (for compatibility across SDK versions)
            String emailId = sendEmailViaReflection(resend, fromEmail, toEmail, subject, htmlBody, textBody);
            
            log.info("✅ Password reset email sent successfully!");
            log.info("   - To: {}", toEmail);
            log.info("   - Email ID: {}", emailId);
            log.info("   - From: {}", fromEmail);
            
        } catch (Exception e) {
            // Check if it's a ResendException
            if (e instanceof ResendException || e.getCause() instanceof ResendException) {
                ResendException resendEx = e instanceof ResendException 
                    ? (ResendException) e 
                    : (ResendException) e.getCause();
                    
                log.error("❌ Resend API Error sending password reset email to {}: {}", toEmail, resendEx.getMessage());
                
                String errorMessage = "Không thể gửi email đặt lại mật khẩu: " + resendEx.getMessage();
                
                // Check for common error messages
                String msg = resendEx.getMessage().toLowerCase();
                if (msg.contains("unauthorized") || msg.contains("401")) {
                    errorMessage = "API Key không hợp lệ. Vui lòng kiểm tra RESEND_API_KEY.";
                } else if (msg.contains("forbidden") || msg.contains("403")) {
                    errorMessage = "Domain chưa được verify trong Resend. Vui lòng verify domain: " + fromEmail.split("@")[1];
                } else if (msg.contains("validation") || msg.contains("422")) {
                    errorMessage = "Email không hợp lệ hoặc domain chưa được cấu hình đúng.";
                } else if (msg.contains("rate limit") || msg.contains("429")) {
                    errorMessage = "Đã vượt quá giới hạn gửi email. Vui lòng thử lại sau.";
                }
                
                throw new RuntimeException(errorMessage, resendEx);
            }
            
            // Handle other exceptions (IllegalStateException, RuntimeException from reflection, etc.)
            if (e instanceof IllegalStateException || e instanceof RuntimeException) {
                // Re-throw RuntimeException (including those from reflection catch block)
                if (e instanceof IllegalStateException) {
                    log.error("❌ Configuration error: {}", e.getMessage());
                }
                throw e;
            }
            
            // Handle other unexpected errors
            log.error("❌ Unexpected error sending password reset email to {}: {}", toEmail, e.getMessage(), e);
            log.error("   - Exception Type: {}", e.getClass().getName());
            throw new RuntimeException("Không thể gửi email đặt lại mật khẩu: " + e.getMessage(), e);
        }
    }
    
    /**
     * Fallback method: Send email using reflection (for compatibility when SDK classes not available)
     */
    private String sendEmailViaReflection(Resend resend, String fromEmail, String toEmail, 
                                          String subject, String htmlBody, String textBody) {
        try {
            Object emailService = resend.emails();
            Class<?> emailServiceClass = emailService.getClass();
            
            // Try SendEmailRequest first (version 2.1.0)
            Class<?> requestClass = Class.forName("com.resend.services.emails.model.SendEmailRequest");
            Class<?> requestBuilderClass = Class.forName("com.resend.services.emails.model.SendEmailRequest$SendEmailRequestBuilder");
            
            Object builder = requestClass.getMethod("builder").invoke(null);
            builder = requestBuilderClass.getMethod("from", String.class).invoke(builder, fromEmail);
            builder = requestBuilderClass.getMethod("to", String.class).invoke(builder, toEmail);
            builder = requestBuilderClass.getMethod("subject", String.class).invoke(builder, subject);
            builder = requestBuilderClass.getMethod("html", String.class).invoke(builder, htmlBody);
            builder = requestBuilderClass.getMethod("text", String.class).invoke(builder, textBody);
            Object emailRequest = requestBuilderClass.getMethod("build").invoke(builder);
            
            Object response = emailServiceClass.getMethod("send", requestClass).invoke(emailService, emailRequest);
            return (String) response.getClass().getMethod("getId").invoke(response);
            
        } catch (ClassNotFoundException e) {
            log.error("❌ Cannot find Resend API classes even with reflection. Error: {}", e.getMessage());
            throw new RuntimeException("Lỗi: Không tìm thấy class Resend API. Vui lòng kiểm tra dependency resend-java version 2.1.0 đã được cài đặt và rebuild project.", e);
        } catch (Exception e) {
            log.error("❌ Reflection error: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi khi gọi Resend API. Chi tiết: " + e.getMessage(), e);
        }
    }
}

