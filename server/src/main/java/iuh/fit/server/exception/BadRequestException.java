package iuh.fit.server.exception;

/**
 * Exception ném ra khi request không hợp lệ
 */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }

    public BadRequestException(String message, Throwable cause) {
        super(message, cause);
    }
}

