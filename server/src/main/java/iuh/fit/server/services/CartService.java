package iuh.fit.server.services;

import iuh.fit.server.dto.request.CartRequest;
import iuh.fit.server.dto.response.CartResponse;

public interface CartService {
    CartResponse clearCart(int cartId);
    
    CartResponse getOrCreateCartByUserId(int userId);
    
    CartResponse mergeCartItems(int userId, java.util.List<iuh.fit.server.dto.request.CartItemRequest> sessionCartItems);
    
    CartResponse syncCartItems(int userId, java.util.List<iuh.fit.server.dto.request.CartItemRequest> cartItems);
}
