package iuh.fit.server.model.entity;

import iuh.fit.server.model.enums.CouponStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.util.Date;

/**
 * Entity đại diện cho mối quan hệ giữa User và Coupon
 * Một user có thể sở hữu nhiều coupon, mỗi coupon chỉ dùng được 1 lần
 */
@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "user_coupon")
public class UserCoupon {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coupon_id", nullable = false)
    private Coupon coupon;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CouponStatus status = CouponStatus.AVAILABLE;

    @CreationTimestamp
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "received_at")
    private Date receivedAt;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "used_at")
    private Date usedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order; // Đơn hàng sử dụng coupon này (nếu đã dùng)
}

