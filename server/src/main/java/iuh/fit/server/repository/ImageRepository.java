package iuh.fit.server.repository;

import iuh.fit.server.model.entity.Image;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for Image entity
 */
@Repository
public interface ImageRepository extends JpaRepository<Image, Integer> {
}
