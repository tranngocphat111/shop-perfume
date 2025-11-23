package iuh.fit.server.mapper;

import iuh.fit.server.dto.request.ProductRequest;
import iuh.fit.server.dto.response.*;
import iuh.fit.server.model.entity.*;
import org.mapstruct.*;

/**
 * Mapper sử dụng MapStruct - Cực kỳ ngắn gọn!
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ProductMapper {

    ProductResponse toResponse(Product product);

    Product toEntity(ProductRequest request);
}


