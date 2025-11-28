package iuh.fit.server.model.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@lombok.ToString(exclude = {"orders", "userCoupons"})
public class Coupon {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int couponId;
    
    private String code;
    private String description;
    private double discountPercent;
    private double minOrderValue;
    private Date startDate;
    private Date endDate;
    private boolean isActive;
    
    // Điều kiện để tự động tặng coupon này cho user
    // Ví dụ: 1000000 = khi user mua đơn hàng >= 1 triệu thì được tặng coupon này
    @Column(name = "trigger_order_value")
    private Double triggerOrderValue;
    
    // Số lần tối đa có thể phát hành cho mỗi user (null = không giới hạn)
    @Column(name = "max_per_user")
    private Integer maxPerUser;

    @OneToMany(mappedBy = "coupon")
    private List<Order> orders;
    
    @OneToMany(mappedBy = "coupon", cascade = CascadeType.ALL)
    private List<UserCoupon> userCoupons;
}
