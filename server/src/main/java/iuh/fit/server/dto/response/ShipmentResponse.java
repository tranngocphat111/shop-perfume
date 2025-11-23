package iuh.fit.server.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentResponse {
    private Integer shipmentId;
    private String trackingNumber;
    private String carrier;
    private String status;
    private Date shippedDate;
    private Date deliveredDate;
}

