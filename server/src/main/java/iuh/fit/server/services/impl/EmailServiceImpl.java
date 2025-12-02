package iuh.fit.server.services.impl;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.SendEmailRequest;
import com.resend.services.emails.model.SendEmailResponse;
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
                errorMessage = "Domain chưa được verify trong Resend. Vui lòng verify domain: " + fromEmail.split("@")[1];
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
}

