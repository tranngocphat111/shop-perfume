package iuh.fit.server.services;

import iuh.fit.server.dto.response.UserDetailResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AdminUserService {
    /**
     * Get users with pagination and search
     */
    Page<UserDetailResponse> getUsersPage(Pageable pageable, String searchTerm);
    
    /**
     * Get user by ID with detailed information
     */
    UserDetailResponse getUserById(Integer userId);
    
    /**
     * Update user status
     */
    void updateUserStatus(Integer userId, String status);
    
    /**
     * Update user roles
     */
    void updateUserRoles(Integer userId, java.util.List<String> roles);
}
