package iuh.fit.server.repository;

import iuh.fit.server.model.entity.Cart;
import iuh.fit.server.model.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface CartRepository extends JpaRepository<Cart, Integer> {
    Cart findCartByUser_UserId(int userId);
}
