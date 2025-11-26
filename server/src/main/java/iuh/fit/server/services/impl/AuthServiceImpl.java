package iuh.fit.server.services.impl;

import iuh.fit.server.dto.request.LoginRequest;
import iuh.fit.server.dto.request.RegisterRequest;
import iuh.fit.server.dto.response.AuthResponse;
import iuh.fit.server.exception.AuthenticationException;
import iuh.fit.server.exception.RegistrationException;
import iuh.fit.server.services.AuthService;

import iuh.fit.server.model.entity.User;
import iuh.fit.server.model.entity.Role;
import iuh.fit.server.model.entity.RefreshToken;
import iuh.fit.server.model.enums.UserStatus;
import iuh.fit.server.repository.UserRepository;
import iuh.fit.server.repository.RoleRepository;
import iuh.fit.server.services.RefreshTokenService;
import iuh.fit.server.util.JwtTokenProvider;
import iuh.fit.server.util.PasswordValidator;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;

    @Transactional
    @Override
    public AuthResponse register(RegisterRequest request) {
        HttpServletRequest httpRequest = getCurrentHttpRequest();
        
        // Validate password strength (simplified)
        List<String> passwordErrors = PasswordValidator.validate(request.getPassword());
        if (!passwordErrors.isEmpty()) {
            String errorMessage = String.join(". ", passwordErrors);
            log.warn("Registration failed - weak password: {}", request.getEmail());
            throw new RegistrationException(errorMessage);
        }
        
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Registration failed - email exists: {}", request.getEmail());
            throw new RegistrationException("Email đã tồn tại");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        // Phone and address removed - users can add addresses after registration
        user.setStatus(UserStatus.ACTIVE);

        Role customerRole = roleRepository.findByName("CUSTOMER")
                .orElseThrow(() -> new RegistrationException("Role CUSTOMER không tồn tại"));

        Set<Role> roles = new HashSet<>();
        roles.add(customerRole);
        user.setRoles(roles);

        user = userRepository.save(user);

        String token = jwtTokenProvider.generateToken(user.getEmail());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user, httpRequest);

        log.info("User registered successfully: {}", user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken.getToken())
                .type("Bearer")
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .role("CUSTOMER")
                .build();
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        HttpServletRequest httpRequest = getCurrentHttpRequest();
        
        // Find user
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.warn("Login failed - user not found: {}", request.getEmail());
                    return new AuthenticationException("Email hoặc mật khẩu không đúng");
                });

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            log.warn("Login failed - wrong password: {}", request.getEmail());
            throw new AuthenticationException("Email hoặc mật khẩu không đúng");
        }

        // Check account status
        if (user.getStatus() != UserStatus.ACTIVE) {
            log.warn("Login failed - inactive account: {}", request.getEmail());
            throw new AuthenticationException("Tài khoản chưa được kích hoạt");
        }

        // Generate tokens
        String token = jwtTokenProvider.generateToken(user.getEmail());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user, httpRequest);

        // Get role
        String roleName = user.getRoles().stream()
                .map(Role::getName)
                .findFirst()
                .orElse("CUSTOMER");

        log.info("User logged in successfully: {}", user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken.getToken())
                .type("Bearer")
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .role(roleName)
                .build();
    }
    
    /**
     * Helper method để lấy current HTTP request
     */
    private HttpServletRequest getCurrentHttpRequest() {
        try {
            ServletRequestAttributes attributes = 
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            return attributes != null ? attributes.getRequest() : null;
        } catch (Exception e) {
            log.warn("Could not get current HTTP request", e);
            return null;
        }
    }
}

