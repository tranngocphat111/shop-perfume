package iuh.fit.server.services.impl;

import iuh.fit.server.dto.request.CartRequest;
import iuh.fit.server.dto.response.CartResponse;
import iuh.fit.server.exception.ResourceNotFoundException;
import iuh.fit.server.mapper.CartMapper;
import iuh.fit.server.model.entity.Cart;
import iuh.fit.server.model.entity.User;
import iuh.fit.server.repository.CartRepository;
import iuh.fit.server.repository.UserRepository;
import iuh.fit.server.services.CartService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CartServiceImpl implements CartService {
    private final CartRepository cartRepository;
    private final CartMapper cartMapper;
    private final UserRepository userRepository;


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
}
