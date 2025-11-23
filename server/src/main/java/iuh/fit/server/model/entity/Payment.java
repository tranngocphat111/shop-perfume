package iuh.fit.server.model.entity;

import iuh.fit.server.model.enums.Method;
import iuh.fit.server.model.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@lombok.ToString(exclude = {"order"})
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int paymentId;

    @Enumerated(EnumType.STRING)
    private Method method;
    private Double amount;
    @Enumerated(EnumType.STRING)
    private PaymentStatus status;
    private Date paymentDate;

    @OneToOne
    @JoinColumn(name = "order_id")
    private Order order;
}

