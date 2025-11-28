package iuh.fit.server.services;

public interface EmailService {
    
    /**
     * Gửi email reset password
     * @param toEmail Email người nhận
     * @param resetToken Token để reset password
     * @param resetUrl URL để reset password (full URL với token)
     */
    void sendPasswordResetEmail(String toEmail, String resetToken, String resetUrl);
}

