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
@lombok.ToString(exclude = {"orders"})
public class Coupon {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int couponId;
    
    private String code;
    private String description;
    private double discountPercent;
    
    @Column(name = "required_points")
    private Integer requiredPoints = 0;
    
    private Date startDate;
    private Date endDate;
    private boolean isActive;

    @OneToMany(mappedBy = "coupon")
    private List<Order> orders;
}
