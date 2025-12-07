package iuh.fit.server.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BrandResponse {
    private int brandId;
    private String name;
    private String country;
    private String description;
    private String url;
    private Date createdAt;
    private Date lastUpdated;
    private String createdBy;
    private String lastUpdatedBy;
}
