package iuh.fit.server.mapper;

import iuh.fit.server.dto.response.OrderResponse;
import iuh.fit.server.model.entity.Order;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, 
        uses = {OrderItemMapper.class, PaymentMapper.class, ShipmentMapper.class})
public interface OrderMapper {
    
    @Mapping(source = "orderItems", target = "orderItems")
    @Mapping(source = "payment", target = "payment")
    @Mapping(source = "shipment", target = "shipment")
    OrderResponse toResponse(Order order);
}

