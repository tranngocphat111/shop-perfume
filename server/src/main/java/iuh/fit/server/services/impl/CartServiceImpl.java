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
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

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
    
    @PersistenceContext
    private EntityManager entityManager;


    @Override
    public CartResponse clearCart(int cartId) {
        log.info("Clearing cart with id: {}", cartId);

        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found with id: " + cartId));

        cart.getItems().clear();
        cart.setTotalAmount(0.0);

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
            cart.setTotalAmount(0.0);
            cart = cartRepository.save(cart);
            entityManager.flush(); // Ensure cart is persisted immediately
            log.info("Created new cart with id: {} for user: {}", cart.getCartId(), userId);
        } else {
            log.info("Found existing cart with id: {} for user: {}", cart.getCartId(), userId);
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
            cart.setTotalAmount(0.0);
            cart = cartRepository.save(cart);
            entityManager.flush(); // Ensure cart is persisted immediately
            log.info("Created new cart with id: {} for user: {}", cart.getCartId(), userId);
        } else {
            log.info("Found existing cart with id: {} for user: {}", cart.getCartId(), userId);
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
                int oldQuantity = item.getQuantity();
                int newQuantity = item.getQuantity() + sessionItem.getQuantity();
                item.setQuantity(newQuantity);
                item.setUnitPrice(product.getUnitPrice());
                item.setSubtotal(product.getUnitPrice() * newQuantity);
                CartItem savedItem = cartItemRepository.save(item);
                // Ensure item is in cart's items list
                if (!cart.getItems().contains(savedItem)) {
                    cart.getItems().add(savedItem);
                }
                log.info("Updated cart item quantity for product {}: {} -> {}", 
                        product.getProductId(), oldQuantity, newQuantity);
            } else {
                // Add new item to cart
                CartItem newItem = new CartItem();
                newItem.setCart(cart);
                newItem.setProduct(product);
                newItem.setQuantity(sessionItem.getQuantity());
                newItem.setUnitPrice(product.getUnitPrice());
                newItem.setSubtotal(product.getUnitPrice() * sessionItem.getQuantity());
                CartItem savedItem = cartItemRepository.save(newItem);
                // Add to cart's items list to maintain bidirectional relationship
                cart.getItems().add(savedItem);
                log.info("Added new cart item for product {} with quantity {}", 
                        product.getProductId(), sessionItem.getQuantity());
            }
        }
        
        // Calculate and update total amount
        double totalAmount = cart.getItems().stream()
                .mapToDouble(CartItem::getSubtotal)
                .sum();
        cart.setTotalAmount(totalAmount);
        
        // Save cart to ensure items and totalAmount are persisted
        cart = cartRepository.save(cart);
        entityManager.flush(); // Ensure all changes are persisted
        
        // Refresh cart to get updated items with JOIN FETCH
        cart = cartRepository.findByIdWithItems(cart.getCartId());
        if (cart == null) {
            throw new ResourceNotFoundException("Cart not found after merge");
        }
        
        int itemCount = cart.getItems() != null ? cart.getItems().size() : 0;
        log.info("Cart merge completed for user: {}, total items: {}, total amount: {}", userId, itemCount, cart.getTotalAmount());
        return cartMapper.toResponse(cart);
    }

    @Override
    public CartResponse syncCartItems(int userId, List<CartItemRequest> cartItems) {
        log.info("Syncing cart items for user: {} with {} items (replace all)", userId, cartItems.size());
        
        // Get or create cart for user
        Cart cart = cartRepository.findCartByUser_UserId(userId);
        if (cart == null) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
            cart = new Cart();
            cart.setUser(user);
            cart.setItems(new java.util.ArrayList<>());
            cart.setTotalAmount(0.0);
            cart = cartRepository.save(cart);
            entityManager.flush(); // Ensure cart is persisted immediately
            log.info("Created new cart with id: {} for user: {}", cart.getCartId(), userId);
        } else {
            log.info("Found existing cart with id: {} for user: {}", cart.getCartId(), userId);
        }
        
        // Clear all existing items first (replace strategy)
        // Delete all existing items explicitly
        List<CartItem> existingItems = cartItemRepository.findCartItemsByCart_CartId(cart.getCartId());
        if (!existingItems.isEmpty()) {
            cartItemRepository.deleteAll(existingItems);
            entityManager.flush(); // Ensure deletes are executed before adding new items
            log.info("Cleared {} existing cart items for user: {}", existingItems.size(), userId);
        }
        
        // Clear the items list in the cart entity
        cart.getItems().clear();
        cart.setTotalAmount(0.0);
        cart = cartRepository.save(cart);
        entityManager.flush(); // Ensure cart is persisted
        entityManager.refresh(cart); // Refresh to ensure cart is managed
        
        // Add new items
        for (CartItemRequest itemRequest : cartItems) {
            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElse(null);
            
            if (product == null) {
                log.warn("Product with id {} not found, skipping", itemRequest.getProductId());
                continue;
            }
            
            double unitPrice = product.getUnitPrice();
            if (unitPrice <= 0) {
                log.warn("Product {} has invalid unitPrice: {}, skipping", product.getProductId(), unitPrice);
                continue;
            }
            
            log.info("Creating cart item for product {} with unitPrice: {}, quantity: {}", 
                    product.getProductId(), unitPrice, itemRequest.getQuantity());
            
            // Create new cart item - ensure cart is properly set
            CartItem newItem = new CartItem();
            newItem.setCart(cart); // Set the managed cart entity
            newItem.setProduct(product);
            newItem.setQuantity(itemRequest.getQuantity());
            newItem.setUnitPrice(unitPrice);
            newItem.setSubtotal(unitPrice * itemRequest.getQuantity());
            
            log.info("CartItem before save - quantity: {}, subtotal: {}, cartId: {}", 
                    newItem.getQuantity(), newItem.getSubtotal(), 
                    newItem.getCart() != null ? newItem.getCart().getCartId() : "null");
            
            // Save the cart item
            CartItem savedItem = cartItemRepository.save(newItem);
            entityManager.flush(); // Ensure item is persisted immediately
            
            log.info("CartItem after save - cartItemId: {}, quantity: {}, subtotal: {}", 
                    savedItem.getCartItemId(), savedItem.getQuantity(), savedItem.getSubtotal());
            
            // Add to cart's items list to maintain bidirectional relationship
            if (cart.getItems() == null) {
                cart.setItems(new java.util.ArrayList<>());
            }
            cart.getItems().add(savedItem);
            log.info("Added cart item for product {} with quantity {}", 
                    product.getProductId(), itemRequest.getQuantity());
        }
        
        // Calculate and update total amount
        double totalAmount = cart.getItems().stream()
                .mapToDouble(CartItem::getSubtotal)
                .sum();
        cart.setTotalAmount(totalAmount);
        
        // Save cart again to ensure items and totalAmount are persisted
        cart = cartRepository.save(cart);
        entityManager.flush(); // Ensure all changes are persisted
        
        // Refresh cart to get updated items with JOIN FETCH
        cart = cartRepository.findByIdWithItems(cart.getCartId());
        if (cart == null) {
            throw new ResourceNotFoundException("Cart not found after sync");
        }
        
        // Force load items by accessing them
        int itemCount = cart.getItems() != null ? cart.getItems().size() : 0;
        log.info("Cart sync completed for user: {}, total items: {}, total amount: {}", userId, itemCount, cart.getTotalAmount());
        return cartMapper.toResponse(cart);
    }
}
