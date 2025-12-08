package iuh.fit.server.services.impl;

import iuh.fit.server.dto.response.UserDetailResponse;
import iuh.fit.server.model.entity.Role;
import iuh.fit.server.model.entity.User;
import iuh.fit.server.model.enums.PaymentStatus;
import iuh.fit.server.repository.OrderRepository;
import iuh.fit.server.repository.RoleRepository;
import iuh.fit.server.repository.UserRepository;
import iuh.fit.server.services.AdminUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminUserServiceImpl implements AdminUserService {
    
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final RoleRepository roleRepository;
    
    @Override
    @Transactional(readOnly = true)
    public Page<UserDetailResponse> getUsersPage(Pageable pageable, String searchTerm) {
        log.info("Getting users page - page: {}, size: {}, search: {}", 
                pageable.getPageNumber(), pageable.getPageSize(), searchTerm);
        
        Page<User> users;
        
        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            users = userRepository.searchUsers(searchTerm, pageable);
        } else {
            users = userRepository.findAll(pageable);
        }
        
        return users.map(this::mapToDetailResponse);
    }
    
    @Override
    @Transactional(readOnly = true)
    public UserDetailResponse getUserById(Integer userId) {
        log.info("Getting user by id: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        return mapToDetailResponse(user);
    }
    
    private UserDetailResponse mapToDetailResponse(User user) {
        // Get total orders count
        Integer totalOrders = user.getOrders() != null ? user.getOrders().size() : 0;
        
        // Get total spent (only completed payments)
        Double totalSpent = orderRepository.getTotalSpentByUser(user.getUserId(), PaymentStatus.PAID);
        if (totalSpent == null) {
            totalSpent = 0.0;
        }
        
        // Get roles
        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());
        
        return UserDetailResponse.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .provider(user.getProvider())
                .status(user.getStatus() != null ? user.getStatus().name() : "ACTIVE")
                .avatar(user.getAvatar())
                .loyaltyPoints(user.getLoyaltyPoints())
                .createdAt(user.getCreatedAt())
                .lastUpdated(user.getLastUpdated())
                .roles(roles)
                .totalOrders(totalOrders)
                .totalSpent(totalSpent)
                .build();
    }
    
    @Override
    @Transactional
    public void updateUserStatus(Integer userId, String status) {
        log.info("Updating user status for id: {} to status: {}", userId, status);
        
        // Find user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        // Validate status
        iuh.fit.server.model.enums.UserStatus newStatus;
        try {
            newStatus = iuh.fit.server.model.enums.UserStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid user status: " + status);
        }
        
        // Update status
        user.setStatus(newStatus);
        user.setLastUpdated(new java.util.Date());
        
        // Save user
        userRepository.save(user);
        
        log.info("User status updated successfully for id: {}", userId);
    }
    
    @Override
    @Transactional
    public void updateUserRoles(Integer userId, List<String> roleNames) {
        log.info("Updating user roles for id: {} to roles: {}", userId, roleNames);
        
        // Validate role list is not empty
        if (roleNames == null || roleNames.isEmpty()) {
            throw new IllegalArgumentException("At least one role must be specified");
        }
        
        // Find user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        // Find and validate all roles
        Set<Role> roles = new HashSet<>();
        for (String roleName : roleNames) {
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new IllegalArgumentException("Invalid role: " + roleName));
            roles.add(role);
        }
        
        // Update user roles
        user.setRoles(roles);
        user.setLastUpdated(new java.util.Date());
        
        // Save user
        userRepository.save(user);
        
        log.info("User roles updated successfully for id: {}", userId);
    }
}
