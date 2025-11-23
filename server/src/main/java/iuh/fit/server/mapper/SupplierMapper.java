package iuh.fit.server.mapper;

import iuh.fit.server.dto.request.SupplierRequest;
import iuh.fit.server.dto.response.SupplierResponse;
import iuh.fit.server.model.entity.Supplier;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

/**
 * Mapper sử dụng MapStruct cho Supplier
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface SupplierMapper {

    SupplierResponse toResponse(Supplier supplier);

    Supplier toEntity(SupplierRequest request);
}
