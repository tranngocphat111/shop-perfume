package iuh.fit.server.repository;

import iuh.fit.server.model.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AddressRepository extends JpaRepository<Address, Integer> {
    List<Address> findByUser_UserIdOrderByIsDefaultDescCreatedAtDesc(Integer userId);
    
    Optional<Address> findByAddressIdAndUser_UserId(Integer addressId, Integer userId);
    
    Optional<Address> findByUser_UserIdAndIsDefaultTrue(Integer userId);
    
    long countByUser_UserId(Integer userId);
}

