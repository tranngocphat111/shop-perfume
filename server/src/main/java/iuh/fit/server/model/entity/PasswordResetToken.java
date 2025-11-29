package iuh.fit.server.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.util.Date;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "password_reset_token", indexes = {
    @Index(name = "idx_token", columnList = "token"),
    @Index(name = "idx_user", columnList = "user_id")
})
public class PasswordResetToken {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 255)
    private String token;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date expiryDate;
    
    @Column(nullable = false)
    private boolean used = false;
    
    @CreationTimestamp
    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false, updatable = false)
    private Date createdAt;
    
    /**
     * Kiểm tra token đã hết hạn chưa
     */
    public boolean isExpired() {
        return new Date().after(expiryDate);
    }
    
    /**
     * Kiểm tra token có hợp lệ không (chưa hết hạn và chưa được sử dụng)
     */
    public boolean isValid() {
        return !used && !isExpired();
    }
}

