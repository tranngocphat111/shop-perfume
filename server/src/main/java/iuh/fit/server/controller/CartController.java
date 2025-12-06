package iuh.fit.server.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import iuh.fit.server.dto.request.CartItemRequest;
import iuh.fit.server.dto.response.CartItemResponse;
import iuh.fit.server.dto.response.CartResponse;
import iuh.fit.server.services.CartItemService;
import iuh.fit.server.services.CartService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/carts")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Cart", description = "Cart Management APIs")
public class CartController {
    private final CartService cartService;
    private final CartItemService cartItemService;



    /**
     * Get or create cart by user ID
     * URL: http://localhost:8080/api/carts/user/{userId}
     */
    @GetMapping("/user/{userId:\\d+}")
    @Operation(summary = "Get or create cart", description = "Get existing cart or create new cart for user")
    public ResponseEntity<CartResponse> getOrCreateCartByUserId(@PathVariable int userId) {
        log.info("REST request to get or create cart for user: {}", userId);
        CartResponse cart = cartService.getOrCreateCartByUserId(userId);
        return ResponseEntity.ok(cart);
    }

    /**
     * Merge session cart items with user's cart
     * URL: http://localhost:8080/api/carts/user/{userId}/merge
     */
    @PostMapping("/user/{userId:\\d+}/merge")
    @Operation(summary = "Merge cart items", description = "Merge session cart items with user's cart in database")
    public ResponseEntity<CartResponse> mergeCartItems(
            @PathVariable int userId,
            @RequestBody List<CartItemRequest> sessionCartItems) {
        log.info("REST request to merge cart items for user: {} with {} items", userId, sessionCartItems.size());
        CartResponse cart = cartService.mergeCartItems(userId, sessionCartItems);
        return ResponseEntity.ok(cart);
    }

    /**
     * Sync cart items (replace all items in cart)
     * URL: http://localhost:8080/api/carts/user/{userId}/sync
     */
    @PostMapping("/user/{userId:\\d+}/sync")
    @Operation(summary = "Sync cart items", description = "Replace all items in user's cart with provided items")
    public ResponseEntity<CartResponse> syncCartItems(
            @PathVariable int userId,
            @RequestBody List<CartItemRequest> cartItems) {
        log.info("REST request to sync cart items for user: {} with {} items", userId, cartItems.size());
        CartResponse cart = cartService.syncCartItems(userId, cartItems);
        return ResponseEntity.ok(cart);
    }

    /**
     * Clear cart (remove all items)
     * URL: http://localhost:8080/api/carts/{cartId}/clear
     */
    @DeleteMapping("/{cartId:\\d+}/clear")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Clear cart", description = "Remove all items from cart")
    public ResponseEntity<CartResponse> clearCart(@PathVariable int cartId) {
        log.info("REST request to clear cart with id: {}", cartId);
        CartResponse cart = cartService.clearCart(cartId);
        return ResponseEntity.ok(cart);
    }

    // ==================== Cart Item Endpoints ====================

    /**
     * Get cart items by cart ID
     * URL: http://localhost:8080/api/carts/{cartId}/items
     */
    @GetMapping("/{cartId:\\d+}/items")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get cart items", description = "Retrieve all items in a specific cart")
    public ResponseEntity<List<CartItemResponse>> getCartItems(@PathVariable int cartId) {
        log.info("REST request to get cart items for cart_id: {}", cartId);
        List<CartItemResponse> items = cartItemService.getCartItemsByCartId(cartId);
        return ResponseEntity.ok(items);
    }

    /**
     * Add item to cart
     * URL: http://localhost:8080/api/carts/{cartId}/items
     */
    @PostMapping("/{cartId:\\d+}/items")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Add item to cart", description = "Add a product to the cart")
    public ResponseEntity<CartItemResponse> addItemToCart(
            @PathVariable int cartId,
            @RequestBody CartItemRequest cartItemRequest) {
        log.info("REST request to add item to cart_id: {}", cartId);
        CartItemResponse item = cartItemService.addItemToCart(cartId, cartItemRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(item);
    }

    /**
     * Update cart item
     * URL: http://localhost:8080/api/carts/items/{cartItemId}
     */
    @PutMapping("/items/{cartItemId:\\d+}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Update cart item", description = "Update quantity of a cart item")
    public ResponseEntity<CartItemResponse> updateCartItem(
            @PathVariable int cartItemId,
            @RequestBody CartItemRequest cartItemRequest) {
        log.info("REST request to update cart item with id: {}", cartItemId);
        CartItemResponse item = cartItemService.updateCartItem(cartItemId, cartItemRequest);
        return ResponseEntity.ok(item);
    }

    /**
     * Remove item from cart
     * URL: http://localhost:8080/api/carts/items/{cartItemId}
     */
    @DeleteMapping("/items/{cartItemId:\\d+}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Remove item from cart", description = "Remove a specific item from cart")
    public ResponseEntity<Void> removeItemFromCart(@PathVariable int cartItemId) {
        log.info("REST request to remove cart item with id: {}", cartItemId);
        cartItemService.removeItemFromCart(cartItemId);
        return ResponseEntity.noContent().build();
    }
}
