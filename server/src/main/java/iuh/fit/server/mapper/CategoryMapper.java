package iuh.fit.server.mapper;

import iuh.fit.server.dto.response.CategoryResponse;
import iuh.fit.server.model.entity.Category;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

/**
 * Mapper cho Category entity
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface CategoryMapper {

    CategoryResponse toResponse(Category category);
}

