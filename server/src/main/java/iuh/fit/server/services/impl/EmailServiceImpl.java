package iuh.fit.server.services.impl;

import iuh.fit.server.email.templates.PasswordResetEmailTemplate;
import iuh.fit.server.services.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.ses.model.*;
import software.amazon.awssdk.services.ses.model.SesException;

import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {
    
    private final PasswordResetEmailTemplate passwordResetEmailTemplate;
    
    @Value("${aws.ses.region:us-east-1}")
    private String awsRegion;
    
    @Value("${aws.ses.from-email:phamdacthinh2301@gmail.com}")
    private String fromEmail;
    
    private SesClient getSesClient() {
        log.debug("Creating SES client with region: {}", awsRegion);
        try {
            DefaultCredentialsProvider credentialsProvider = DefaultCredentialsProvider.create();
            log.debug("AWS Credentials Provider created successfully");
            
            SesClient client = SesClient.builder()
                    .region(Region.of(awsRegion))
                    .credentialsProvider(credentialsProvider)
                    .build();
            
            log.debug("SES client created successfully");
            return client;
        } catch (Exception e) {
            log.error("Failed to create SES client: {}", e.getMessage(), e);
            throw new RuntimeException("Không thể khởi tạo AWS SES client. Vui lòng kiểm tra AWS credentials và region. Chi tiết: " + e.getMessage(), e);
        }
    }
    
    @Override
    public void sendPasswordResetEmail(String toEmail, String resetToken, String resetUrl) {
        log.info("Attempting to send password reset email to: {}", toEmail);
        log.info("Using AWS SES Region: {}, From Email: {}", awsRegion, fromEmail);
        
        try (SesClient sesClient = getSesClient()) {
            String subject = passwordResetEmailTemplate.getSubject(resetUrl);
            String htmlBody = passwordResetEmailTemplate.buildHtml(resetUrl);
            String textBody = passwordResetEmailTemplate.buildText(resetUrl);
            
            log.debug("Building email request for destination: {}", toEmail);
            
            SendEmailRequest emailRequest = SendEmailRequest.builder()
                    .destination(Destination.builder()
                            .toAddresses(toEmail)
                            .build())
                    .message(Message.builder()
                            .subject(Content.builder()
                                    .data(subject)
                                    .charset(StandardCharsets.UTF_8.name())
                                    .build())
                            .body(Body.builder()
                                    .html(Content.builder()
                                            .data(htmlBody)
                                            .charset(StandardCharsets.UTF_8.name())
                                            .build())
                                    .text(Content.builder()
                                            .data(textBody)
                                            .charset(StandardCharsets.UTF_8.name())
                                            .build())
                                    .build())
                            .build())
                    .source(fromEmail)
                    .build();
            
            log.info("Sending email via AWS SES...");
            SendEmailResponse response = sesClient.sendEmail(emailRequest);
            log.info("✅ Password reset email sent successfully!");
            log.info("   - To: {}", toEmail);
            log.info("   - Message ID: {}", response.messageId());
            log.info("   - Region: {}", awsRegion);
            log.info("   - From: {}", fromEmail);
        } catch (SesException e) {
            log.error("❌ AWS SES Error sending password reset email to {}: {}", toEmail, e.getMessage());
            log.error("   - Error Code: {}", e.awsErrorDetails().errorCode());
            log.error("   - Error Message: {}", e.awsErrorDetails().errorMessage());
            log.error("   - Request ID: {}", e.requestId());
            log.error("   - Status Code: {}", e.statusCode());
            
            // Provide more helpful error messages
            String errorCode = e.awsErrorDetails().errorCode();
            String errorMessage = "Không thể gửi email đặt lại mật khẩu";
            
            if ("MessageRejected".equals(errorCode)) {
                errorMessage = "Email bị từ chối. Có thể email người nhận chưa được verify trong AWS SES (Sandbox mode) hoặc email người gửi chưa được verify.";
            } else if ("MailFromDomainNotVerifiedException".equals(errorCode)) {
                errorMessage = "Email người gửi chưa được verify trong AWS SES. Vui lòng verify email: " + fromEmail;
            } else if ("ConfigurationSetDoesNotExistException".equals(errorCode)) {
                errorMessage = "Cấu hình AWS SES không đúng. Vui lòng kiểm tra lại.";
            } else if ("AccountSendingPausedException".equals(errorCode)) {
                errorMessage = "Tài khoản AWS SES đang bị tạm dừng gửi email.";
            }
            
            throw new RuntimeException(errorMessage + " (Error: " + errorCode + ")", e);
        } catch (Exception e) {
            log.error("❌ Unexpected error sending password reset email to {}: {}", toEmail, e.getMessage(), e);
            log.error("   - Exception Type: {}", e.getClass().getName());
            throw new RuntimeException("Không thể gửi email đặt lại mật khẩu: " + e.getMessage(), e);
        }
    }
}

