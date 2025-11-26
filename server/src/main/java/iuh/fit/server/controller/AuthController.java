package iuh.fit.server.controller;

import iuh.fit.server.dto.request.LoginRequest;
import iuh.fit.server.dto.request.RefreshTokenRequest;
import iuh.fit.server.dto.request.RegisterRequest;
import iuh.fit.server.dto.response.AuthResponse;
import iuh.fit.server.dto.response.TokenRefreshResponse;
import iuh.fit.server.model.entity.RefreshToken;
import iuh.fit.server.model.entity.User;
import iuh.fit.server.services.AuthService;
import iuh.fit.server.services.RefreshTokenService;
import iuh.fit.server.util.JwtTokenProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller xử lý authentication và authorization (Simplified for academic project)
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "API xử lý authentication và authorization")
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản mới")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {
        log.info("Registration attempt for email: {}", request.getEmail());
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        log.info("Login attempt for email: {}", request.getEmail());
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token bằng refresh token")
    @Transactional
    public ResponseEntity<TokenRefreshResponse> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request,
            HttpServletRequest httpRequest) {
        String requestRefreshToken = request.getRefreshToken();
        
        // Verify refresh token (this loads User with JOIN FETCH)
        RefreshToken refreshToken = refreshTokenService.verifyRefreshToken(requestRefreshToken);
        
        // Get user email while still in transaction to avoid LazyInitializationException
        String userEmail = refreshToken.getUser().getEmail();
        User user = refreshToken.getUser(); // User is already loaded by JOIN FETCH
        
        // Generate new access token
        String newAccessToken = jwtTokenProvider.generateToken(userEmail);
        
        // Generate new refresh token (rotate refresh token)
        RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user, httpRequest);
        
        // Revoke old refresh token
        refreshTokenService.revokeRefreshToken(requestRefreshToken);
        
        log.info("Token refreshed successfully for user: {}", userEmail);
        
        return ResponseEntity.ok(TokenRefreshResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken.getToken())
                .type("Bearer")
                .build());
    }

    @PostMapping("/logout")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Đăng xuất và revoke refresh token")
    public ResponseEntity<Map<String, String>> logout(
            @RequestBody(required = false) RefreshTokenRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication != null ? authentication.getName() : "unknown";
        
        // Revoke refresh token nếu có
        if (request != null && request.getRefreshToken() != null) {
            refreshTokenService.revokeRefreshToken(request.getRefreshToken());
        }
        
        log.info("User logged out: {}", email);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Đăng xuất thành công");
        return ResponseEntity.ok(response);
    }
}

