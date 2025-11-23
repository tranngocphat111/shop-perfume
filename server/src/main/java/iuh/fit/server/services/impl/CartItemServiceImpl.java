package iuh.fit.server.services.impl;

import iuh.fit.server.dto.request.CartItemRequest;
import iuh.fit.server.dto.response.CartItemResponse;
import iuh.fit.server.exception.ResourceNotFoundException;
import iuh.fit.server.mapper.CartItemMapper;
import iuh.fit.server.model.entity.Cart;
import iuh.fit.server.model.entity.CartItem;
import iuh.fit.server.model.entity.Product;
import iuh.fit.server.repository.CartItemRepository;
import iuh.fit.server.repository.CartRepository;
import iuh.fit.server.repository.ProductRepository;
import iuh.fit.server.services.CartItemService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CartItemServiceImpl implements CartItemService {
    private final CartItemRepository cartItemRepository;
    private final CartItemMapper cartItemMapper;
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CartItemResponse> getCartItemsByCartId(int cartId) {
        log.info("Finding cart items by cart_id: {}", cartId);
        return cartItemRepository.findCartItemsByCart_CartId(cartId).stream()
                .map(cartItemMapper::toResponse)
                .toList();
    }

    @Override
    public CartItemResponse addItemToCart(int cartId, CartItemRequest cartItemRequest) {
        log.info("Adding item to cart_id: {}", cartId);

        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found with id: " + cartId));

        Product product = productRepository.findById(cartItemRequest.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + cartItemRequest.getProductId()));

        // Check if item already exists in cart
        Optional<CartItem> existingItem = cartItemRepository.findByCart_CartIdAndProduct_ProductId(
                cartId, cartItemRequest.getProductId());

        CartItem cartItem;
        if (existingItem.isPresent()) {
            // Update quantity if item already exists
            cartItem = existingItem.get();
            cartItem.setQuantity(cartItem.getQuantity() + cartItemRequest.getQuantity());
            log.info("Updated existing cart item quantity to: {}", cartItem.getQuantity());
        } else {
            // Create new cart item
            cartItem = new CartItem();
            cartItem.setCart(cart);
            cartItem.setProduct(product);
            cartItem.setQuantity(cartItemRequest.getQuantity());
            log.info("Created new cart item");
        }

        cartItem.setSubtotal(cartItem.getProduct().getUnitPrice() * cartItem.getQuantity());
        CartItem savedItem = cartItemRepository.save(cartItem);

        return cartItemMapper.toResponse(savedItem);
    }

    @Override
    public CartItemResponse updateCartItem(int cartItemId, CartItemRequest cartItemRequest) {
        log.info("Updating cart item with id: {}", cartItemId);

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + cartItemId));

        cartItem.setQuantity(cartItemRequest.getQuantity());
        cartItem.setSubtotal(cartItem.getProduct().getUnitPrice() * cartItem.getQuantity());

        CartItem updatedItem = cartItemRepository.save(cartItem);


        log.info("Updated cart item with id: {}", cartItemId);
        return cartItemMapper.toResponse(updatedItem);
    }

    @Override
    public void removeItemFromCart(int cartItemId) {
        log.info("Removing cart item with id: {}", cartItemId);

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + cartItemId));

        Cart cart = cartItem.getCart();
        cartItemRepository.delete(cartItem);

        log.info("Removed cart item with id: {}", cartItemId);
    }


}
