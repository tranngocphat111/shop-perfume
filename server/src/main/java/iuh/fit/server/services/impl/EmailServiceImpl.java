package iuh.fit.server.services.impl;

import iuh.fit.server.email.templates.PasswordResetEmailTemplate;
import iuh.fit.server.services.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {
    
    private final PasswordResetEmailTemplate passwordResetEmailTemplate;
    
    @Value("${resend.api-key:}")
    private String resendApiKey;
    
    @Value("${resend.from-email:}")
    private String fromEmail;
    
    private Resend getResendClient() {
        if (resendApiKey == null || resendApiKey.isEmpty()) {
            throw new RuntimeException("Resend API key chưa được cấu hình. Vui lòng set RESEND_API_KEY environment variable.");
        }
        return new Resend(resendApiKey);
    }
    
    @Override
    public void sendPasswordResetEmail(String toEmail, String resetToken, String resetUrl) {
        log.info("Attempting to send password reset email to: {}", toEmail);
        log.info("Using Resend, From Email: {}", fromEmail);
        
        if (fromEmail == null || fromEmail.isEmpty()) {
            throw new RuntimeException("Resend from email chưa được cấu hình. Vui lòng set RESEND_FROM_EMAIL environment variable.");
        }
        
        try {
            Resend resend = getResendClient();
            String subject = passwordResetEmailTemplate.getSubject(resetUrl);
            String htmlBody = passwordResetEmailTemplate.buildHtml(resetUrl);
            String textBody = passwordResetEmailTemplate.buildText(resetUrl);
            
            log.debug("Building email request for destination: {}", toEmail);
            
            CreateEmailOptions emailOptions = CreateEmailOptions.builder()
                    .from(fromEmail)
                    .to(toEmail)
                    .subject(subject)
                    .html(htmlBody)
                    .text(textBody)
                    .build();
            
            log.info("Sending email via Resend...");
            CreateEmailResponse response = resend.emails().send(emailOptions);
            log.info("✅ Password reset email sent successfully!");
            log.info("   - To: {}", toEmail);
            log.info("   - Email ID: {}", response.getId());
            log.info("   - From: {}", fromEmail);
        } catch (ResendException e) {
            log.error("❌ Resend Error sending password reset email to {}: {}", toEmail, e.getMessage());
            log.error("   - Error Type: {}", e.getClass().getSimpleName());
            
            // Provide more helpful error messages
            String errorMessage = "Không thể gửi email đặt lại mật khẩu";
            
            if (e.getMessage() != null) {
                String message = e.getMessage().toLowerCase();
                if (message.contains("invalid") || message.contains("unauthorized")) {
                    errorMessage = "Resend API key không hợp lệ hoặc chưa được cấu hình đúng. Vui lòng kiểm tra RESEND_API_KEY.";
                } else if (message.contains("domain") || message.contains("verify")) {
                    errorMessage = "Email hoặc domain người gửi chưa được verify trong Resend. Vui lòng verify email: " + fromEmail;
                } else if (message.contains("rate limit") || message.contains("quota")) {
                    errorMessage = "Đã vượt quá giới hạn gửi email của Resend. Vui lòng thử lại sau.";
                }
            }
            
            throw new RuntimeException(errorMessage + " (Error: " + e.getMessage() + ")", e);
        } catch (Exception e) {
            log.error("❌ Unexpected error sending password reset email to {}: {}", toEmail, e.getMessage(), e);
            log.error("   - Exception Type: {}", e.getClass().getName());
            throw new RuntimeException("Không thể gửi email đặt lại mật khẩu: " + e.getMessage(), e);
        }
    }
}

