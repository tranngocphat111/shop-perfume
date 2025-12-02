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
     * Send email using reflection (for compatibility across SDK versions)
     * Tries multiple class names to support different SDK versions
     */
    private String sendEmailViaReflection(Resend resend, String fromEmail, String toEmail, 
                                          String subject, String htmlBody, String textBody) {
        Object emailService = resend.emails();
        Class<?> emailServiceClass = emailService.getClass();
        
        // Try different class names for different SDK versions
        String[] possibleRequestClasses = {
            "com.resend.services.emails.model.SendEmailRequest",  // Version 2.0.0, 2.1.0
            "com.resend.services.emails.model.CreateEmailOptions" // Alternative name (if exists)
        };
        
        for (String requestClassName : possibleRequestClasses) {
            try {
                log.debug("Trying Resend API class: {}", requestClassName);
                
                Class<?> requestClass = Class.forName(requestClassName);
                // Try different builder class name patterns
                String[] possibleBuilderClasses = {
                    requestClassName + "$" + requestClass.getSimpleName() + "Builder",
                    requestClassName + "$Builder"
                };
                
                Class<?> requestBuilderClass = null;
                for (String builderClassName : possibleBuilderClasses) {
                    try {
                        requestBuilderClass = Class.forName(builderClassName);
                        log.debug("Found builder class: {}", builderClassName);
                        break;
                    } catch (ClassNotFoundException e) {
                        // Try next pattern
                        continue;
                    }
                }
                
                if (requestBuilderClass == null) {
                    log.debug("Builder class not found for: {}, trying next request class...", requestClassName);
                    continue;
                }
                
                // Create builder
                Object builder = requestClass.getMethod("builder").invoke(null);
                
                // Set email properties
                builder = requestBuilderClass.getMethod("from", String.class).invoke(builder, fromEmail);
                builder = requestBuilderClass.getMethod("to", String.class).invoke(builder, toEmail);
                builder = requestBuilderClass.getMethod("subject", String.class).invoke(builder, subject);
                builder = requestBuilderClass.getMethod("html", String.class).invoke(builder, htmlBody);
                builder = requestBuilderClass.getMethod("text", String.class).invoke(builder, textBody);
                Object emailRequest = requestBuilderClass.getMethod("build").invoke(builder);
                
                // Send email
                Object response = emailServiceClass.getMethod("send", requestClass).invoke(emailService, emailRequest);
                
                // Get email ID
                String emailId = (String) response.getClass().getMethod("getId").invoke(response);
                
                log.info("✅ Successfully used Resend API class: {}", requestClassName);
                return emailId;
                
            } catch (ClassNotFoundException e) {
                log.debug("Class not found: {}, trying next...", requestClassName);
                continue; // Try next class name
            } catch (NoSuchMethodException e) {
                log.debug("Method not found for class: {} - {}, trying next...", requestClassName, e.getMessage());
                continue; // Try next class name
            } catch (IllegalAccessException e) {
                log.debug("Illegal access for class: {} - {}, trying next...", requestClassName, e.getMessage());
                continue; // Try next class name
            } catch (java.lang.reflect.InvocationTargetException e) {
                Throwable cause = e.getCause();
                if (cause instanceof ResendException) {
                    // Re-throw ResendException directly
                    throw (ResendException) cause;
                }
                log.error("❌ Error using Resend API class {}: {}", requestClassName, e.getMessage(), e);
                if (cause != null) {
                    log.error("   Caused by: {} - {}", cause.getClass().getName(), cause.getMessage());
                }
                throw new RuntimeException("Lỗi khi gọi Resend API với class " + requestClassName + ". Chi tiết: " + e.getMessage(), e);
            } catch (Exception e) {
                // If we got here, class was found but something else failed
                log.error("❌ Error using Resend API class {}: {}", requestClassName, e.getMessage(), e);
                throw new RuntimeException("Lỗi khi gọi Resend API với class " + requestClassName + ". Chi tiết: " + e.getMessage(), e);
            }
        }
        
        // If we get here, none of the class names worked
        log.error("❌ Cannot find any Resend API classes. Tried: {}", String.join(", ", possibleRequestClasses));
        throw new RuntimeException("Lỗi: Không tìm thấy class Resend API. Đã thử các class: " + 
            String.join(", ", possibleRequestClasses) + 
            ". Vui lòng kiểm tra dependency resend-java version 2.0.0 hoặc 2.1.0 đã được cài đặt và rebuild project.");
    }
}

