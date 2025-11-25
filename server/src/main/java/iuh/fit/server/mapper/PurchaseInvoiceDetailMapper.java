package iuh.fit.server.mapper;

import iuh.fit.server.dto.request.PurchaseInvoiceDetailRequest;
import iuh.fit.server.dto.response.PurchaseInvoiceDetailResponse;
import iuh.fit.server.model.entity.PurchaseInvoiceDetail;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, uses = {ProductMapper.class})
public interface PurchaseInvoiceDetailMapper {
    
    @Mapping(target = "purchaseInvoiceDetailId", ignore = true)
    @Mapping(target = "product", ignore = true)
    @Mapping(target = "purchaseInvoice", ignore = true)
    @Mapping(target = "subTotal", ignore = true)
    PurchaseInvoiceDetail toEntity(PurchaseInvoiceDetailRequest request);
    
    PurchaseInvoiceDetailResponse toResponse(PurchaseInvoiceDetail detail);
}
