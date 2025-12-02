package iuh.fit.server.repository;

import iuh.fit.server.model.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
    
    Optional<User> findByGoogleId(String googleId);
    
    @Query("SELECT COUNT(DISTINCT u) FROM User u JOIN u.roles r WHERE r.name = :roleName")
    Long countByRoleName(@Param("roleName") String roleName);
    
    @Query("SELECT COUNT(DISTINCT u) FROM User u JOIN u.roles r WHERE r.name = :roleName AND u.createdAt >= :createdAfter")
    Long countByRoleNameAndCreatedAtAfter(@Param("roleName") String roleName, @Param("createdAfter") java.util.Date createdAfter);
    
    // Search users by name, email
    @Query("SELECT u FROM User u WHERE " +
            "LOWER(u.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "CAST(u.userId AS string) LIKE CONCAT('%', :searchTerm, '%')")
    Page<User> searchUsers(@Param("searchTerm") String searchTerm, Pageable pageable);
}
