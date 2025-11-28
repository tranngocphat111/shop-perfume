package iuh.fit.server.repository;

import iuh.fit.server.model.entity.PasswordResetToken;
import iuh.fit.server.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    
    /**
     * Tìm token theo token string
     */
    Optional<PasswordResetToken> findByToken(String token);
    
    /**
     * Tìm tất cả tokens của một user
     */
    List<PasswordResetToken> findByUser(User user);
    
    /**
     * Xóa tất cả tokens đã hết hạn trước một ngày cụ thể
     */
    @Modifying
    @Query("DELETE FROM PasswordResetToken p WHERE p.expiryDate < :date")
    void deleteByExpiryDateBefore(@Param("date") Date date);
    
    /**
     * Xóa tất cả tokens của một user (khi reset password thành công)
     */
    @Modifying
    @Query("DELETE FROM PasswordResetToken p WHERE p.user = :user")
    void deleteByUser(@Param("user") User user);
}

