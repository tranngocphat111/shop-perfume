package iuh.fit.server.services.impl;

import iuh.fit.server.dto.request.CartItemRequest;
import iuh.fit.server.dto.response.CartResponse;
import iuh.fit.server.exception.ResourceNotFoundException;
import iuh.fit.server.mapper.CartMapper;
import iuh.fit.server.model.entity.Cart;
import iuh.fit.server.model.entity.CartItem;
import iuh.fit.server.model.entity.Product;
import iuh.fit.server.model.entity.User;
import iuh.fit.server.repository.CartItemRepository;
import iuh.fit.server.repository.CartRepository;
import iuh.fit.server.repository.ProductRepository;
import iuh.fit.server.repository.UserRepository;
import iuh.fit.server.services.CartService;
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
public class CartServiceImpl implements CartService {
    private final CartRepository cartRepository;
    private final CartMapper cartMapper;
    private final UserRepository userRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;


    @Override
    public CartResponse clearCart(int cartId) {
        log.info("Clearing cart with id: {}", cartId);

        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found with id: " + cartId));

        cart.getItems().clear();

        Cart clearedCart = cartRepository.save(cart);
        log.info("Cleared cart with id: {}", cartId);

        return cartMapper.toResponse(clearedCart);
    }

    @Override
    public CartResponse getOrCreateCartByUserId(int userId) {
        log.info("Getting or creating cart for user: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        Cart cart = cartRepository.findCartByUser_UserId(userId);
        
        if (cart == null) {
            log.info("Cart not found for user {}, creating new cart", userId);
            cart = new Cart();
            cart.setUser(user);
            cart.setItems(new java.util.ArrayList<>());
            cart = cartRepository.save(cart);
            log.info("Created new cart with id: {} for user: {}", cart.getCartId(), userId);
        }
        
        return cartMapper.toResponse(cart);
    }

    @Override
    public CartResponse mergeCartItems(int userId, List<CartItemRequest> sessionCartItems) {
        log.info("Merging cart items for user: {} with {} items from session", userId, sessionCartItems.size());
        
        // Get or create cart for user
        Cart cart = cartRepository.findCartByUser_UserId(userId);
        if (cart == null) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
            cart = new Cart();
            cart.setUser(user);
            cart.setItems(new java.util.ArrayList<>());
            cart = cartRepository.save(cart);
            log.info("Created new cart with id: {} for user: {}", cart.getCartId(), userId);
        }
        
        // Merge session cart items with DB cart
        for (CartItemRequest sessionItem : sessionCartItems) {
            Product product = productRepository.findById(sessionItem.getProductId())
                    .orElse(null);
            
            if (product == null) {
                log.warn("Product with id {} not found, skipping", sessionItem.getProductId());
                continue;
            }
            
            // Check if item already exists in cart
            Optional<CartItem> existingItem = cartItemRepository.findByCart_CartIdAndProduct_ProductId(
                    cart.getCartId(), sessionItem.getProductId());
            
            if (existingItem.isPresent()) {
                // Update quantity (add session quantity to existing quantity)
                CartItem item = existingItem.get();
                int newQuantity = item.getQuantity() + sessionItem.getQuantity();
                item.setQuantity(newQuantity);
                item.setSubtotal(product.getUnitPrice() * newQuantity);
                cartItemRepository.save(item);
                log.info("Updated cart item quantity for product {}: {} -> {}", 
                        product.getProductId(), item.getQuantity() - sessionItem.getQuantity(), item.getQuantity());
            } else {
                // Add new item to cart
                CartItem newItem = new CartItem();
                newItem.setCart(cart);
                newItem.setProduct(product);
                newItem.setQuantity(sessionItem.getQuantity());
                newItem.setSubtotal(product.getUnitPrice() * sessionItem.getQuantity());
                cartItemRepository.save(newItem);
                log.info("Added new cart item for product {} with quantity {}", 
                        product.getProductId(), sessionItem.getQuantity());
            }
        }
        
        // Refresh cart to get updated items
        cart = cartRepository.findById(cart.getCartId())
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found after merge"));
        
        log.info("Cart merge completed for user: {}, total items: {}", userId, cart.getItems().size());
        return cartMapper.toResponse(cart);
    }
}
