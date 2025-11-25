package iuh.fit.server.mapper;

import iuh.fit.server.dto.request.PurchaseInvoiceRequest;
import iuh.fit.server.dto.response.PurchaseInvoiceResponse;
import iuh.fit.server.model.entity.PurchaseInvoice;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, uses = {SupplierMapper.class, PurchaseInvoiceDetailMapper.class})
public interface PurchaseInvoiceMapper {
    
    @Mapping(target = "purchaseInvoiceId", ignore = true)
    @Mapping(target = "supplier", ignore = true)
    @Mapping(target = "details", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "lastUpdated", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "lastUpdatedBy", ignore = true)
    PurchaseInvoice toEntity(PurchaseInvoiceRequest request);
    
    PurchaseInvoiceResponse toResponse(PurchaseInvoice purchaseInvoice);
}
