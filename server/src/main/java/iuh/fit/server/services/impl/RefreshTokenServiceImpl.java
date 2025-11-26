package iuh.fit.server.services.impl;

import iuh.fit.server.exception.TokenRefreshException;
import iuh.fit.server.model.entity.RefreshToken;
import iuh.fit.server.model.entity.User;
import iuh.fit.server.repository.RefreshTokenRepository;
import iuh.fit.server.services.RefreshTokenService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenServiceImpl implements RefreshTokenService {
    
    private final RefreshTokenRepository refreshTokenRepository;
    
    // Refresh token validity (7 days)
    @Value("${jwt.refresh-token-expiration:604800000}")
    private long refreshTokenExpiration;
    
    @Override
    @Transactional
    public RefreshToken createRefreshToken(User user, HttpServletRequest request) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setExpiryDate(Instant.now().plusMillis(refreshTokenExpiration));
        refreshToken.setRevoked(false);
        
        refreshToken = refreshTokenRepository.save(refreshToken);
        log.info("Created refresh token for user: {}", user.getEmail());
        
        return refreshToken;
    }
    
    @Override
    @Transactional(readOnly = true)
    public RefreshToken verifyRefreshToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new TokenRefreshException("Refresh token không tồn tại"));
        
        if (refreshToken.isRevoked()) {
            log.warn("Attempted to use revoked refresh token: {}", token);
            throw new TokenRefreshException("Refresh token đã bị thu hồi");
        }
        
        if (refreshToken.isExpired()) {
            log.warn("Refresh token expired: {}", token);
            refreshTokenRepository.delete(refreshToken);
            throw new TokenRefreshException("Refresh token đã hết hạn. Vui lòng đăng nhập lại");
        }
        
        return refreshToken;
    }
    
    @Override
    @Transactional
    public void revokeRefreshToken(String token) {
        refreshTokenRepository.findByToken(token).ifPresent(refreshToken -> {
            refreshToken.setRevoked(true);
            refreshTokenRepository.save(refreshToken);
            log.info("Revoked refresh token for user: {}", refreshToken.getUser().getEmail());
        });
    }
    
    @Override
    @Transactional
    public void revokeAllUserTokens(int userId) {
        refreshTokenRepository.revokeAllByUserId(userId);
        log.info("Revoked all refresh tokens for userId: {}", userId);
    }
    
    @Override
    @Transactional
    public void cleanupExpiredTokens() {
        try {
            refreshTokenRepository.deleteExpiredTokens();
            log.info("Cleaned up expired refresh tokens");
        } catch (Exception e) {
            log.error("Failed to cleanup expired refresh tokens", e);
        }
    }
}

