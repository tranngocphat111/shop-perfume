package iuh.fit.server.exception;

/**
 * Exception được throw khi có lỗi xác thực (authentication)
 * Ví dụ: sai email/password, tài khoản không active
 */
public class AuthenticationException extends RuntimeException {
    public AuthenticationException(String message) {
        super(message);
    }

    public AuthenticationException(String message, Throwable cause) {
        super(message, cause);
    }
}

