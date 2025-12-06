package iuh.fit.server.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.util.Date;

/**
 * Entity lưu trữ refresh tokens để quản lý và revoke
 */
@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "refresh_tokens", indexes = {
    @Index(name = "idx_token", columnList = "token"),
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_revoked", columnList = "revoked")
})
public class RefreshToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 500)
    private String token; // Lưu full token để check chính xác

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "expiry_date", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date expiresAt;

    @Column(nullable = false)
    private boolean revoked = false;

    @Column
    @Temporal(TemporalType.TIMESTAMP)
    private Date revokedAt;

    /**
     * Token mới thay thế token này (để detect reuse attack)
     * Nếu token bị revoke và có replacedByToken, nghĩa là đã được rotate
     * Nếu ai đó cố dùng lại token này sau khi đã rotate → REUSE ATTACK
     */
    @Column(length = 500)
    private String replacedByToken;

    @CreationTimestamp
    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false, updatable = false)
    private Date createdAt;

    /**
     * Kiểm tra token đã hết hạn chưa
     */
    public boolean isExpired() {
        return expiresAt.before(new Date());
    }

    /**
     * Kiểm tra token có bị revoke không
     */
    public boolean isRevoked() {
        return revoked;
    }

    /**
     * Kiểm tra token có hợp lệ không (chưa revoke và chưa hết hạn)
     */
    public boolean isValid() {
        return !revoked && !isExpired();
    }

    /**
     * Revoke token
     */
    public void revoke() {
        this.revoked = true;
        this.revokedAt = new Date();
    }

    /**
     * Revoke token và set replacedByToken (token rotation)
     */
    public void revokeAndReplace(String newToken) {
        this.revoked = true;
        this.revokedAt = new Date();
        this.replacedByToken = newToken;
    }

    /**
     * Kiểm tra token có bị reuse attack không
     * Nếu token đã revoked và có replacedByToken, nghĩa là đã được rotate
     * Nếu ai đó cố dùng lại → reuse attack
     */
    public boolean isReuseAttack() {
        return revoked && replacedByToken != null && !replacedByToken.isEmpty();
    }
}

