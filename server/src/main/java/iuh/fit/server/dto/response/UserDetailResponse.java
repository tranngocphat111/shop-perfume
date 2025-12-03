package iuh.fit.server.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDetailResponse {
    private Integer userId;
    private String name;
    private String email;
    private String provider;
    private String status;
    private String avatar;
    private Integer loyaltyPoints;
    private Date createdAt;
    private Date lastUpdated;
    private List<String> roles;
    private Integer totalOrders;
    private Double totalSpent;
}
