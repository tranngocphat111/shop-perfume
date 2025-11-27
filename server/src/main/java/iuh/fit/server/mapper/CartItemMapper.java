package iuh.fit.server.mapper;

import iuh.fit.server.dto.response.CartItemResponse;
import iuh.fit.server.model.entity.CartItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, uses = {ProductMapper.class})
public interface CartItemMapper {
    @Mapping(source = "cart.cartId", target = "cartId")
    @Mapping(source = "product.unitPrice", target = "unitPrice")
    CartItemResponse toResponse(CartItem cartItem);

}
