package iuh.fit.server.repository;

import iuh.fit.server.model.entity.RefreshToken;
import iuh.fit.server.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    
    /**
     * Tìm refresh token theo token string
     */
    Optional<RefreshToken> findByToken(String token);

    /**
     * Tìm refresh token hợp lệ (chưa revoke, chưa hết hạn) theo token string
     */
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.token = :token AND rt.revoked = false AND rt.expiresAt > :now")
    Optional<RefreshToken> findValidToken(@Param("token") String token, @Param("now") Date now);

    /**
     * Tìm token theo token string (kể cả đã revoked) - để detect reuse attack
     */
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.token = :token")
    Optional<RefreshToken> findByTokenIncludingRevoked(@Param("token") String token);

    /**
     * Revoke tất cả refresh tokens của user (khi logout hoặc security issue)
     */
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true, rt.revokedAt = :now WHERE rt.user = :user AND rt.revoked = false")
    int revokeAllUserTokens(@Param("user") User user, @Param("now") Date now);

    /**
     * Revoke một token cụ thể
     */
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true, rt.revokedAt = :now WHERE rt.token = :token")
    int revokeToken(@Param("token") String token, @Param("now") Date now);

    /**
     * Xóa các tokens đã hết hạn (cleanup job)
     */
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :now")
    int deleteExpiredTokens(@Param("now") Date now);

    /**
     * Đếm số lượng tokens hợp lệ của user
     */
    @Query("SELECT COUNT(rt) FROM RefreshToken rt WHERE rt.user = :user AND rt.revoked = false AND rt.expiresAt > :now")
    long countValidTokensByUser(@Param("user") User user, @Param("now") Date now);
}

