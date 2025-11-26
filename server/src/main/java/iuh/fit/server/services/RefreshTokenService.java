package iuh.fit.server.services;

import iuh.fit.server.model.entity.RefreshToken;
import iuh.fit.server.model.entity.User;
import jakarta.servlet.http.HttpServletRequest;

/**
 * Service để quản lý Refresh Tokens
 */
public interface RefreshTokenService {
    
    /**
     * Tạo refresh token mới cho user
     */
    RefreshToken createRefreshToken(User user, HttpServletRequest request);
    
    /**
     * Verify refresh token
     */
    RefreshToken verifyRefreshToken(String token);
    
    /**
     * Revoke refresh token
     */
    void revokeRefreshToken(String token);
    
    /**
     * Revoke all refresh tokens của user
     */
    void revokeAllUserTokens(int userId);
    
    /**
     * Clean up expired tokens
     */
    void cleanupExpiredTokens();
}

