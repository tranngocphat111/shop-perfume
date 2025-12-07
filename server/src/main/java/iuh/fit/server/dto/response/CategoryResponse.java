package iuh.fit.server.dto.response;

import iuh.fit.server.model.enums.Gender;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {
    private int categoryId;
    private String name;
    private String description;
    private Gender gender;
    private Date createdAt;
    private Date lastUpdated;
    private String createdBy;
    private String lastUpdatedBy;
}
