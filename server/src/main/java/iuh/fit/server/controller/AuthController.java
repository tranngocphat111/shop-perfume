package iuh.fit.server.controller;

import iuh.fit.server.dto.request.ChangePasswordRequest;
import iuh.fit.server.dto.request.ForgotPasswordRequest;
import iuh.fit.server.dto.request.GoogleSignInRequest;
import iuh.fit.server.dto.request.LoginRequest;
import iuh.fit.server.dto.request.RefreshTokenRequest;
import iuh.fit.server.dto.request.RegisterRequest;
import iuh.fit.server.dto.request.ResetPasswordRequest;
import iuh.fit.server.dto.request.UpdateUserRequest;
import iuh.fit.server.dto.response.AuthResponse;
import iuh.fit.server.dto.response.TokenRefreshResponse;
import iuh.fit.server.dto.response.UserInfoResponse;
import iuh.fit.server.services.AuthService;
import iuh.fit.server.util.CookieUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller xử lý đăng ký và đăng nhập
 * Sử dụng HTTP-only cookies để lưu JWT tokens (bảo mật hơn localStorage)
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "API xử lý đăng ký và đăng nhập")
public class AuthController {

    private final AuthService authService;
    private final CookieUtil cookieUtil;

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản mới")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response) {
        AuthResponse authResponse = authService.register(request);

        // Set HTTP-only cookies
        ResponseCookie accessCookie = cookieUtil.createAccessTokenCookie(authResponse.getToken());
        ResponseCookie refreshCookie = cookieUtil.createRefreshTokenCookie(authResponse.getRefreshToken());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(authResponse);
    }

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        AuthResponse authResponse = authService.login(request);

        // Set HTTP-only cookies
        ResponseCookie accessCookie = cookieUtil.createAccessTokenCookie(authResponse.getToken());
        ResponseCookie refreshCookie = cookieUtil.createRefreshTokenCookie(authResponse.getRefreshToken());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(authResponse);
    }

    @PostMapping("/google-signin")
    @Operation(summary = "Đăng nhập bằng Google", description = "Xác thực và đăng nhập bằng Google ID token")
    public ResponseEntity<AuthResponse> googleSignIn(
            @Valid @RequestBody GoogleSignInRequest request,
            HttpServletResponse response) {
        AuthResponse authResponse = authService.signInWithGoogle(request.getIdToken());

        // Set HTTP-only cookies
        ResponseCookie accessCookie = cookieUtil.createAccessTokenCookie(authResponse.getToken());
        ResponseCookie refreshCookie = cookieUtil.createRefreshTokenCookie(authResponse.getRefreshToken());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(authResponse);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Làm mới access token bằng refresh token")
    public ResponseEntity<TokenRefreshResponse> refreshToken(
            @Valid @RequestBody(required = false) RefreshTokenRequest request,
            @CookieValue(name = "refresh_token", required = false) String refreshTokenCookie,
            HttpServletResponse response) {

        // Ưu tiên lấy refresh token từ cookie, nếu không có thì lấy từ body
        String refreshToken = refreshTokenCookie;
        if (refreshToken == null && request != null) {
            refreshToken = request.getRefreshToken();
        }

        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        RefreshTokenRequest tokenRequest = new RefreshTokenRequest();
        tokenRequest.setRefreshToken(refreshToken);

        TokenRefreshResponse tokenResponse = authService.refreshToken(tokenRequest);

        // Set new access token cookie
        ResponseCookie accessCookie = cookieUtil.createAccessTokenCookie(tokenResponse.getAccessToken());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .body(tokenResponse);
    }

    /**
     * Đăng xuất - revoke tất cả refresh tokens và clear cookies
     * Yêu cầu user phải đăng nhập
     */
    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Đăng xuất - revoke tất cả refresh tokens và clear cookies")
    public ResponseEntity<Void> logout(
            Authentication authentication,
            HttpServletResponse response) {
        if (authentication != null && authentication.isAuthenticated()) {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String email = userDetails.getUsername();
            authService.logout(email);
        }

        // Clear HTTP-only cookies
        ResponseCookie clearAccessCookie = cookieUtil.createAccessTokenClearCookie();
        ResponseCookie clearRefreshCookie = cookieUtil.createRefreshTokenClearCookie();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearAccessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, clearRefreshCookie.toString())
                .build();
    }

    /**
     * GET /api/auth/me - Lấy thông tin user hiện tại (bao gồm điểm tích lũy)
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get current user info", description = "Get current authenticated user information including loyalty points")
    public ResponseEntity<UserInfoResponse> getCurrentUser(Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String email = userDetails.getUsername();
            log.info("✅ Getting user info for email: {} (isAuthenticated=true)", email);

            // Use service method to get user info (eliminates code duplication)
            UserInfoResponse response = authService.getUserInfo(email);

            log.info("Successfully retrieved user info for userId: {}, loyaltyPoints: {}",
                    response.getUserId(), response.getLoyaltyPoints());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error getting current user info: {}", e.getMessage());
            return ResponseEntity.status(404).build();
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
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String email = userDetails.getUsername();
            log.info("✅ Updating profile for email: {} (isAuthenticated=true)", email);

            UserInfoResponse response = authService.updateProfile(email, request);
            log.info("Successfully updated profile for userId: {}", response.getUserId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error updating user profile", e);
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Quên mật khẩu", description = "Gửi email chứa link đặt lại mật khẩu")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(Map.of("message", "Nếu email của bạn tồn tại trong hệ thống, một liên kết đặt lại mật khẩu đã được gửi đến bạn."));
    }

    /**
     * Đặt lại mật khẩu với token
     * Public endpoint
     */
    @PostMapping("/reset-password")
    @Operation(summary = "Đặt lại mật khẩu", description = "Đặt lại mật khẩu mới bằng token từ email")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message", "Mật khẩu đã được đặt lại thành công."));
    }
    
    /**
     * Đổi mật khẩu (yêu cầu đăng nhập)
     * Protected endpoint
     */
    @PostMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Đổi mật khẩu", description = "Đổi mật khẩu cho người dùng đã đăng nhập")
    public ResponseEntity<Map<String, String>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String email = userDetails.getUsername();
            log.info("✅ Changing password for email: {} (isAuthenticated=true)", email);

            authService.changePassword(email, request.getCurrentPassword(), request.getNewPassword());

            log.info("Password changed successfully for email: {}", email);
            return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công."));
        } catch (RuntimeException e) {
            log.error("Error changing password: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error changing password", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Có lỗi xảy ra khi đổi mật khẩu."));
        }
    }
}
