package iuh.fit.server.repository;

import iuh.fit.server.model.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Integer> {
    List<CartItem> findCartItemsByCart_CartId(int cartCartId);
    Optional<CartItem> findByCart_CartIdAndProduct_ProductId(int cartId, int productId);
}
