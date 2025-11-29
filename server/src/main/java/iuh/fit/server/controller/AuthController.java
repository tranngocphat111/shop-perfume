package iuh.fit.server.controller;

import iuh.fit.server.dto.request.ForgotPasswordRequest;
import iuh.fit.server.dto.request.LoginRequest;
import iuh.fit.server.dto.request.RefreshTokenRequest;
import iuh.fit.server.dto.request.RegisterRequest;
import iuh.fit.server.dto.request.ResetPasswordRequest;
import iuh.fit.server.dto.request.UpdateUserRequest;
import iuh.fit.server.dto.request.ChangePasswordRequest;
import iuh.fit.server.dto.response.AuthResponse;
import iuh.fit.server.dto.response.TokenRefreshResponse;
import iuh.fit.server.dto.response.UserInfoResponse;
import iuh.fit.server.services.AuthService;
import iuh.fit.server.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;

/**
 * Controller xử lý đăng ký và đăng nhập
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "API xử lý đăng ký và đăng nhập")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản mới")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Làm mới access token bằng refresh token")
    public ResponseEntity<TokenRefreshResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request));
    }

    /**
     * Đăng xuất - revoke tất cả refresh tokens
     * Yêu cầu user phải đăng nhập
     */
    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Đăng xuất - revoke tất cả refresh tokens")
    public ResponseEntity<Void> logout(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String email = userDetails.getUsername();
            authService.logout(email);
        }
        return ResponseEntity.ok().build();
    }

    /**
     * GET /api/auth/me - Lấy thông tin user hiện tại (bao gồm điểm tích lũy)
     */
    @GetMapping("/me")
    @Operation(summary = "Get current user info", description = "Get current authenticated user information including loyalty points")
    public ResponseEntity<UserInfoResponse> getCurrentUser(Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated() ||
                    authentication.getPrincipal().equals("anonymousUser")) {
                log.warn("Unauthenticated request to /auth/me");
                return ResponseEntity.status(401).build();
            }

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String email = userDetails.getUsername();
            log.info("Getting user info for email: {}", email);

            Optional<iuh.fit.server.model.entity.User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                log.warn("User not found for email: {}", email);
                return ResponseEntity.status(404).build();
            }

            iuh.fit.server.model.entity.User user = userOpt.get();
            UserInfoResponse response = new UserInfoResponse();
            response.setUserId(user.getUserId());
            response.setName(user.getName());
            response.setEmail(user.getEmail());
            response.setLoyaltyPoints(user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0);

            // Safely get role
            String role = "CUSTOMER";
            if (user.getRoles() != null && !user.getRoles().isEmpty()) {
                role = user.getRoles().stream()
                        .map(r -> r != null ? r.getName() : "CUSTOMER")
                        .filter(name -> name != null)
                        .findFirst()
                        .orElse("CUSTOMER");
            }
            response.setRole(role);

            log.info("Successfully retrieved user info for userId: {}, loyaltyPoints: {}",
                    user.getUserId(), response.getLoyaltyPoints());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting current user info", e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * PUT /api/auth/me - Cập nhật thông tin user hiện tại
     */
    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Update current user profile", description = "Update current authenticated user information (name)")
    public ResponseEntity<UserInfoResponse> updateProfile(
            @Valid @RequestBody UpdateUserRequest request,
            Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated() ||
                    authentication.getPrincipal().equals("anonymousUser")) {
                log.warn("Unauthenticated request to PUT /auth/me");
                return ResponseEntity.status(401).build();
            }

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String email = userDetails.getUsername();
            log.info("Updating profile for email: {}", email);

            UserInfoResponse response = authService.updateProfile(email, request);
            log.info("Successfully updated profile for userId: {}", response.getUserId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error updating user profile", e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * PUT /api/auth/change-password - Đổi mật khẩu
     */
    @PutMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Change password", description = "Change password for authenticated user")
    public ResponseEntity<Void> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated() ||
                    authentication.getPrincipal().equals("anonymousUser")) {
                log.warn("Unauthenticated request to PUT /auth/change-password");
                return ResponseEntity.status(401).build();
            }

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String email = userDetails.getUsername();
            log.info("Changing password for email: {}", email);

            authService.changePassword(email, request);
            log.info("Password changed successfully for email: {}", email);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("Error changing password: {}", e.getMessage());
            // Return error message in response body
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            log.error("Error changing password", e);
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Quên mật khẩu", description = "Gửi email chứa link đặt lại mật khẩu")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok().build();
    }

    /**
     * Đặt lại mật khẩu với token
     * Public endpoint
     */
    @PostMapping("/reset-password")
    @Operation(summary = "Đặt lại mật khẩu", description = "Đặt lại mật khẩu mới bằng token từ email")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok().build();
    }
}
