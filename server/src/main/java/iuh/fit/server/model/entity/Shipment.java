package iuh.fit.server.model.entity;

import iuh.fit.server.model.enums.ShipmentStatus;
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
public class Shipment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int shipmentId;

    private String trackingNumber;
    private String carrier;

    @Enumerated(EnumType.STRING)
    private ShipmentStatus status;

    private Date shippedDate;
    private Date deliveredDate;

    @OneToOne
    @JoinColumn(name = "order_id")
    private Order order;
}

