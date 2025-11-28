package iuh.fit.server.services.impl;

import iuh.fit.server.services.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.ses.model.*;

import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {
    
    @Value("${aws.ses.region:ap-southeast-1}")
    private String awsRegion;
    
    @Value("${aws.ses.from-email:noreply@shop-perfume.com}")
    private String fromEmail;
    
    private SesClient getSesClient() {
        return SesClient.builder()
                .region(Region.of(awsRegion))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }
    
    @Override
    public void sendPasswordResetEmail(String toEmail, String resetToken, String resetUrl) {
        try (SesClient sesClient = getSesClient()) {
            String subject = "Đặt lại mật khẩu - Shop Perfume";
            String htmlBody = buildPasswordResetEmailHtml(resetUrl);
            String textBody = buildPasswordResetEmailText(resetUrl);
            
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
            
            SendEmailResponse response = sesClient.sendEmail(emailRequest);
            log.info("Password reset email sent successfully to {} with message ID: {}", 
                    toEmail, response.messageId());
        } catch (Exception e) {
            log.error("Error sending password reset email to {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Không thể gửi email đặt lại mật khẩu", e);
        }
    }
    
    private String buildPasswordResetEmailHtml(String resetUrl) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Đặt lại mật khẩu</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
                    <h1 style="color: #000; text-align: center; margin-bottom: 30px;">Shop Perfume</h1>
                    <h2 style="color: #333; margin-bottom: 20px;">Đặt lại mật khẩu</h2>
                    <p style="margin-bottom: 20px;">Xin chào,</p>
                    <p style="margin-bottom: 20px;">
                        Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình. 
                        Vui lòng nhấp vào nút bên dưới để đặt lại mật khẩu:
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="%s" style="background-color: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                            Đặt lại mật khẩu
                        </a>
                    </div>
                    <p style="margin-bottom: 10px; font-size: 14px; color: #666;">
                        Hoặc sao chép và dán liên kết sau vào trình duyệt của bạn:
                    </p>
                    <p style="margin-bottom: 20px; font-size: 12px; color: #999; word-break: break-all;">
                        %s
                    </p>
                    <p style="margin-bottom: 10px; font-size: 14px; color: #666;">
                        <strong>Lưu ý:</strong> Liên kết này sẽ hết hạn sau 1 giờ.
                    </p>
                    <p style="margin-bottom: 10px; font-size: 14px; color: #666;">
                        Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
                    </p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
                        Email này được gửi tự động, vui lòng không trả lời.
                    </p>
                </div>
            </body>
            </html>
            """.formatted(resetUrl, resetUrl);
    }
    
    private String buildPasswordResetEmailText(String resetUrl) {
        return """
            Shop Perfume - Đặt lại mật khẩu
            
            Xin chào,
            
            Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.
            Vui lòng truy cập liên kết sau để đặt lại mật khẩu:
            
            %s
            
            Lưu ý: Liên kết này sẽ hết hạn sau 1 giờ.
            
            Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
            
            ---
            Email này được gửi tự động, vui lòng không trả lời.
            """.formatted(resetUrl);
    }
}

