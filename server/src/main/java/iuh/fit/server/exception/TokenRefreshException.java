package iuh.fit.server.exception;

/**
 * Exception cho refresh token errors
 */
public class TokenRefreshException extends RuntimeException {
    
    public TokenRefreshException(String message) {
        super(message);
    }
    
    public TokenRefreshException(String message, Throwable cause) {
        super(message, cause);
    }
}

