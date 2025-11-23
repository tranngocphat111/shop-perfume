package iuh.fit.server.dto.response;

import iuh.fit.server.model.enums.ProductStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

/**
 * DTO cho response trả về thông tin Product
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {

    private int productId;
    private String name;
    private String description;
    private String perfumeLongevity;
    private String perfumeConcentration;
    private String releaseYear;
    private int columeMl;
    private ProductStatus status;
    private double unitPrice;
    private Date createdAt;
    private Date lastUpdated;
    private String createdBy;
    private String lastUpdatedBy;
    private BrandResponse brand;
    private CategoryResponse category;
    private List<ImageResponse> images;

}

