package iuh.fit.server.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {
    private Integer reviewId;
    private Integer rating;
    private String comment;
    private Date createdAt;
    private Date lastUpdated;
    private Integer userId;
    private String userName;
    private Integer productId;
    private String productName;
}

