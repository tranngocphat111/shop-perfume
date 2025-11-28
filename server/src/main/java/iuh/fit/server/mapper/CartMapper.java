package iuh.fit.server.mapper;

import iuh.fit.server.dto.response.CartResponse;
import iuh.fit.server.model.entity.Cart;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, uses = {CartItemMapper.class})
public interface CartMapper {
    @Mapping(source = "user.userId", target = "userId")
    @Mapping(source = "totalAmount", target = "totalAmount")
    CartResponse toResponse(Cart cart);
}
