package iuh.fit.server.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.util.Date;
import java.util.List;


@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "`order`")
@lombok.ToString(exclude = {"user", "orderItems", "payment", "shipment"})
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int orderId;

    private Date orderDate;
    private double totalAmount;
    private String guestName;
    private String guestEmail;
    private String guestPhone;
    private String guestAddress;

    @CreationTimestamp
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;


    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderItem> orderItems;

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL)
    private Payment payment;

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL)
    private Shipment shipment;

    // Số tiền đã được giảm (từ coupon hoặc khuyến mãi)
    // Tính bằng: (tổng giá sản phẩm) - totalAmount
    @Column(columnDefinition = "DOUBLE DEFAULT 0")
    private Double discountAmount = 0.0;
}

