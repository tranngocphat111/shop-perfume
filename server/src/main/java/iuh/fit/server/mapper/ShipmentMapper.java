package iuh.fit.server.mapper;

import iuh.fit.server.dto.response.ShipmentResponse;
import iuh.fit.server.model.entity.Shipment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ShipmentMapper {
    
    @Mapping(source = "status", target = "status", qualifiedByName = "statusToString")
    ShipmentResponse toResponse(Shipment shipment);
    
    @Named("statusToString")
    default String statusToString(iuh.fit.server.model.enums.ShipmentStatus status) {
        return status != null ? status.name() : null;
    }
}

