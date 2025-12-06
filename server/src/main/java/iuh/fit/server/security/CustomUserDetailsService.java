package iuh.fit.server.security;

import iuh.fit.server.model.entity.User;
import iuh.fit.server.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

/**
 * Service load thông tin user từ database cho Spring Security
 * - Load user theo email
 * - Chuyển đổi roles và permissions thành authorities
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy user với email: " + email));

        // Log để debug authorization issues
        log.debug("Loading user: {}, User ID: {}, Roles count: {}", 
                user.getEmail(), user.getUserId(), user.getRoles() != null ? user.getRoles().size() : 0);
        
        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            user.getRoles().forEach(role -> 
                log.debug("User {} has role: {}", user.getEmail(), role.getName())
            );
        } else {
            log.warn("⚠️ User {} has NO ROLES assigned! This will cause authorization failures.", user.getEmail());
        }

        // Handle Google users (no password) - use empty string or a placeholder
        String password = user.getPasswordHash() != null ? user.getPasswordHash() : "{noop}";
        
        Collection<? extends GrantedAuthority> authorities = getAuthorities(user);
        log.debug("User {} authorities: {}", user.getEmail(), authorities);
        
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(password)
                .authorities(authorities)
                .accountLocked(false)
                .accountExpired(false)
                .credentialsExpired(false)
                .disabled(false)
                .build();
    }

    /**
     * Lấy danh sách authorities từ roles và permissions
     * Format: ROLE_ADMIN, ROLE_CUSTOMER, READ_PRODUCT, WRITE_PRODUCT,...
     */
    private Collection<? extends GrantedAuthority> getAuthorities(User user) {
        Set<GrantedAuthority> authorities = new HashSet<>();

        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            log.warn("⚠️ User {} has no roles! Returning empty authorities.", user.getEmail());
            return authorities;
        }

        // Thêm roles (chỉ dùng roles, không dùng permissions)
        user.getRoles().forEach(role -> {
            String roleAuthority = "ROLE_" + role.getName();
            authorities.add(new SimpleGrantedAuthority(roleAuthority));
            log.debug("Added role authority: {} for user {}", roleAuthority, user.getEmail());
        });

        log.debug("Total authorities for user {}: {}", user.getEmail(), authorities.size());
        return authorities;
    }
}

