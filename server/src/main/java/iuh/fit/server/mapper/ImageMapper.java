package iuh.fit.server.mapper;

import iuh.fit.server.dto.response.ImageResponse;
import iuh.fit.server.model.entity.Image;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

/**
 * Mapper cho Image entity
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ImageMapper {

    ImageResponse toResponse(Image image);
}

