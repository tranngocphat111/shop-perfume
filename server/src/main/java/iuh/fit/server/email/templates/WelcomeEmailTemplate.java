package iuh.fit.server.email.templates;

import org.springframework.stereotype.Component;

/**
 * Template cho email chào mừng (Welcome)
 */
@Component
public class WelcomeEmailTemplate implements EmailTemplate {

    private static final String SUBJECT = "Chào mừng đến với SPTN";

    @Override
    public String getSubject(Object... data) {
        return SUBJECT;
    }

    @Override
    public String buildHtml(Object... data) {
        // data[0] = frontendUrl, data[1] = name (optional)
        if (data.length < 1) {
            throw new IllegalArgumentException("WelcomeEmailTemplate requires frontendUrl parameter");
        }
        String frontendUrl = (String) data[0];
        String name = data.length > 1 && data[1] != null ? (String) data[1] : "Khách hàng";

        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width,initial-scale=1" />
              <style>
                body { font-family: Arial, sans-serif; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
                .content { background-color: #fff; padding: 24px; border-radius: 6px; margin-top: 12px; }
                .btn { display: inline-block; padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <a href="%s" style="display:inline-flex;align-items:center;gap:12px;color:#fff;text-decoration:none;">
                    <img src="https://res.cloudinary.com/piin/image/upload/logo/sptn_den.png" alt="SPTN" style="width:140px;height:auto;display:block;" />
                    <h1 style="margin:0;font-size:22px;">SPTN</h1>
                  </a>
                </div>
                <div class="content">
                  <p>Xin chào <strong>%s</strong>,</p>
                  <p>Cảm ơn bạn đã đăng ký tài khoản tại SPTN. Chúng tôi rất vui khi được phục vụ bạn.</p>
                  <p>Hãy khám phá các sản phẩm nước hoa mới nhất và nhận ưu đãi đặc biệt cho thành viên.</p>
                  <p><a href="%s" class="btn">Mua sắm ngay</a></p>
                  <p>Trân trọng,<br/>SPTN</p>
                </div>
                <div style="text-align:center; color:#999; font-size:12px; margin-top:14px;">
                  <p>Đây là email tự động từ SPTN. Vui lòng không trả lời email này.</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(frontendUrl, name, frontendUrl);
    }

    @Override
    public String buildText(Object... data) {
        if (data.length < 1) {
            throw new IllegalArgumentException("WelcomeEmailTemplate requires frontendUrl parameter");
        }
        String frontendUrl = (String) data[0];
        String name = data.length > 1 && data[1] != null ? (String) data[1] : "Khách hàng";

        return """
            SPTN - Chào mừng

            Xin chào %s,

            Cảm ơn bạn đã đăng ký tài khoản tại SPTN.
            Truy cập ngay: %s

            Trân trọng,
            SPTN

            (Đây là email tự động, vui lòng không trả lời.)
            """.formatted(name, frontendUrl);
    }
}
