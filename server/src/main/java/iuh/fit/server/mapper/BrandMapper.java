package iuh.fit.server.mapper;

import iuh.fit.server.dto.response.BrandResponse;
import iuh.fit.server.model.entity.Brand;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

/**
 * Mapper cho Brand entity
 * Cực kỳ ngắn gọn với MapStruct!
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface BrandMapper {

    BrandResponse toResponse(Brand brand);
}

