package iuh.fit.server.email.templates;

import org.springframework.stereotype.Component;

/**
 * Template cho email đặt lại mật khẩu
 */
@Component
public class PasswordResetEmailTemplate implements EmailTemplate {
    
    private static final String SUBJECT = "Đặt lại mật khẩu - SPTN";

    @Override
    public String getSubject(Object... data) {
        return SUBJECT;
    }
    
    @Override
    public String buildHtml(Object... data) {
        if (data.length < 1) {
            throw new IllegalArgumentException("PasswordResetEmailTemplate requires resetUrl parameter");
        }
        String resetUrl = (String) data[0];
        
        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                <title>Đặt lại mật khẩu - SPTN</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f4f4f4; margin: 0; padding: 0;">
                <table role="presentation" style="width: 100%%; border-collapse: collapse; background-color: #f4f4f4; padding: 20px;">
                    <tr>
                        <td align="center" style="padding: 20px 0;">
                            <table role="presentation" style="width: 600px; max-width: 100%%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <!-- Header -->
                                <tr>
                                    <td style="padding: 24px 24px 12px; text-align: center; border-bottom: 1px solid #eeeeee;">
                                        <img src="https://res.cloudinary.com/piin/image/upload/logo/sptn_den.png" alt="SPTN" style="width:140px;height:auto;display:block;margin:0 auto 8px;" />
                                        <h1 style="margin: 0; color: #000000; font-size: 24px; font-weight: 700; letter-spacing: 1px;">SPTN</h1>
                                    </td>
                                </tr>
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px;">
                                        <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 500;">Đặt lại mật khẩu</h2>
                                        <p style="margin: 0 0 20px; color: #666666; font-size: 16px;">Xin chào,</p>
                                        <p style="margin: 0 0 30px; color: #666666; font-size: 16px;">
                                            Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản SPTN của mình.
                                            Vui lòng nhấp vào nút bên dưới để đặt lại mật khẩu:
                                        </p>
                                        <!-- CTA Button -->
                                        <table role="presentation" style="width: 100%%; border-collapse: collapse; margin: 30px 0;">
                                            <tr>
                                                <td align="center" style="padding: 0;">
                                                    <a href="%s" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">Đặt lại mật khẩu</a>
                                                </td>
                                            </tr>
                                        </table>
                                        <!-- Alternative Link -->
                                        <p style="margin: 30px 0 10px; color: #666666; font-size: 14px;">
                                            Nếu nút không hoạt động, vui lòng sao chép và dán liên kết sau vào trình duyệt:
                                        </p>
                                        <p style="margin: 0 0 30px; padding: 12px; background-color: #f8f9fa; border-radius: 4px; word-break: break-all; font-size: 12px; color: #333333; font-family: monospace;">
                                            %s
                                        </p>
                                        <!-- Important Notice -->
                                        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
                                            <p style="margin: 0; color: #856404; font-size: 14px;">
                                                <strong>Lưu ý quan trọng:</strong> Liên kết này sẽ hết hạn sau 1 giờ. Vui lòng sử dụng ngay.
                                            </p>
                                        </div>
                                        <p style="margin: 20px 0 0; color: #999999; font-size: 14px;">
                                            Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.
                                        </p>
                                    </td>
                                </tr>
                                <!-- Footer -->
                                <tr>
                                    <td style="padding: 20px 24px; background-color: #f8f9fa; border-top: 1px solid #eeeeee; text-align: center;">
                                        <p style="margin: 0; color: #999999; font-size: 12px;">
                                            Email này được gửi tự động từ hệ thống SPTN.<br>
                                            Vui lòng không trả lời email này.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """.formatted(resetUrl, resetUrl);
    }
    
    @Override
    public String buildText(Object... data) {
        if (data.length < 1) {
            throw new IllegalArgumentException("PasswordResetEmailTemplate requires resetUrl parameter");
        }
        String resetUrl = (String) data[0];
        
        return """
            Shop Perfume - Đặt lại mật khẩu
            
            Xin chào,
            
            Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.
            Vui lòng truy cập liên kết sau để đặt lại mật khẩu:
            
            %s
            
            Lưu ý: Liên kết này sẽ hết hạn sau 1 giờ.
            
            Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
            
            ---
            Email này được gửi tự động từ hệ thống Shop Perfume, vui lòng không trả lời.
            """.formatted(resetUrl);
    }
}
