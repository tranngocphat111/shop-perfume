package iuh.fit.server.exception;

/**
 * Exception được throw khi có lỗi khi đăng ký tài khoản
 * Ví dụ: email đã tồn tại
 */
public class RegistrationException extends RuntimeException {
    public RegistrationException(String message) {
        super(message);
    }

    public RegistrationException(String message, Throwable cause) {
        super(message, cause);
    }
}

