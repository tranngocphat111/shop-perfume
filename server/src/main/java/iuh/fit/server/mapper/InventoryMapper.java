package iuh.fit.server.mapper;

import iuh.fit.server.dto.response.InventoryResponse;
import iuh.fit.server.model.entity.Inventory;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

/**
 * Mapper cho Inventory entity
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface InventoryMapper {

    InventoryResponse toResponse(Inventory inventory);
}

