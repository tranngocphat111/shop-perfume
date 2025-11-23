package iuh.fit.server.services;

import iuh.fit.server.dto.request.CartRequest;
import iuh.fit.server.dto.response.CartResponse;

public interface CartService {
    CartResponse clearCart(int cartId);
}
