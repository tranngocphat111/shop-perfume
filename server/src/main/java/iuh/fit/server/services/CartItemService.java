package iuh.fit.server.services;

import iuh.fit.server.dto.request.CartItemRequest;
import iuh.fit.server.dto.response.CartItemResponse;

import java.util.List;

public interface CartItemService {
    List<CartItemResponse> getCartItemsByCartId(int cartId);
    CartItemResponse addItemToCart(int cartId, CartItemRequest cartItemRequest);
    CartItemResponse updateCartItem(int cartItemId, CartItemRequest cartItemRequest);
    void removeItemFromCart(int cartItemId);
}
