package iuh.fit.server.services.impl;

import iuh.fit.server.dto.request.ForgotPasswordRequest;
import iuh.fit.server.dto.request.LoginRequest;
import iuh.fit.server.dto.request.RefreshTokenRequest;
import iuh.fit.server.dto.request.RegisterRequest;
import iuh.fit.server.dto.request.ResetPasswordRequest;
import iuh.fit.server.dto.response.AuthResponse;
import iuh.fit.server.dto.response.TokenRefreshResponse;
import iuh.fit.server.exception.AuthenticationException;
import iuh.fit.server.exception.RegistrationException;
import iuh.fit.server.services.AuthService;
import iuh.fit.server.services.EmailService;

import iuh.fit.server.model.entity.PasswordResetToken;
import iuh.fit.server.model.entity.RefreshToken;
import iuh.fit.server.model.entity.User;
import iuh.fit.server.model.entity.Role;
import iuh.fit.server.model.enums.UserStatus;
import iuh.fit.server.repository.PasswordResetTokenRepository;
import iuh.fit.server.repository.RefreshTokenRepository;
import iuh.fit.server.repository.UserRepository;
import iuh.fit.server.repository.RoleRepository;
import iuh.fit.server.util.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService{

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;
    
    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;
    
    private static final int TOKEN_EXPIRATION_HOURS = 1;
    private static final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
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

        // Note: Welcome coupon logic removed - users now use loyalty points system
        // New users start with 0 loyalty points and can earn points through purchases

        String token = jwtTokenProvider.generateToken(user.getEmail());
        String refreshTokenString = jwtTokenProvider.generateRefreshToken(user.getEmail());

        // Lưu refresh token vào database
        saveRefreshToken(user, refreshTokenString);

        return new AuthResponse(
                token,
                refreshTokenString,
                "Bearer",
                user.getUserId(),
                user.getName(),
                user.getEmail(),
                "CUSTOMER"
        );
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AuthenticationException("Email hoặc mật khẩu không đúng"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AuthenticationException("Email hoặc mật khẩu không đúng");
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AuthenticationException("Tài khoản chưa được kích hoạt");
        }

        String token = jwtTokenProvider.generateToken(user.getEmail());
        String refreshTokenString = jwtTokenProvider.generateRefreshToken(user.getEmail());

        // Lưu refresh token vào database
        saveRefreshToken(user, refreshTokenString);

        // Lấy role đầu tiên từ set roles
        String roleName = user.getRoles().stream()
                .map(Role::getName)
                .findFirst()
                .orElse("CUSTOMER");

        return new AuthResponse(
                token,
                refreshTokenString,
                "Bearer",
                user.getUserId(),
                user.getName(),
                user.getEmail(),
                roleName
        );
    }

    @Override
    @Transactional
    public TokenRefreshResponse refreshToken(RefreshTokenRequest request) {
        String refreshTokenString = request.getRefreshToken();

        // Validate JWT token structure và signature
        if (!jwtTokenProvider.validateRefreshToken(refreshTokenString)) {
            throw new AuthenticationException("Refresh token không hợp lệ hoặc đã hết hạn");
        }

        // Tìm token trong database (kể cả đã revoked để detect reuse attack)
        RefreshToken refreshToken = refreshTokenRepository.findByTokenIncludingRevoked(refreshTokenString)
                .orElseThrow(() -> new AuthenticationException("Refresh token không tồn tại"));

        // REUSE ATTACK DETECTION
        // Nếu token đã revoked và có replacedByToken → đây là reuse attack
        if (refreshToken.isReuseAttack()) {
            User user = refreshToken.getUser();
            
            // Log security incident với thông tin chi tiết
            log.error("🚨 SECURITY ALERT: Refresh Token Reuse Attack Detected!");
            log.error("   User: {}", user.getEmail());
            log.error("   User ID: {}", user.getUserId());
            log.error("   Attacked Token (first 50 chars): {}...", 
                refreshTokenString.substring(0, Math.min(50, refreshTokenString.length())));
            log.error("   Replaced By Token (first 50 chars): {}...", 
                refreshToken.getReplacedByToken().substring(0, Math.min(50, refreshToken.getReplacedByToken().length())));
            log.error("   Original Token Revoked At: {}", refreshToken.getRevokedAt());
            log.error("   Action: Revoking all tokens for user {} for security", user.getEmail());
            
            // Revoke tất cả tokens của user để bảo vệ tài khoản
            refreshTokenRepository.revokeAllUserTokens(user, new Date());
            
            throw new AuthenticationException("Security violation detected: Refresh token reuse attack. All tokens have been revoked for security.");
        }

        // Kiểm tra token có hợp lệ không (chưa revoke, chưa hết hạn)
        if (!refreshToken.isValid()) {
            if (refreshToken.isExpired()) {
                throw new AuthenticationException("Refresh token đã hết hạn");
            }
            if (refreshToken.isRevoked()) {
                throw new AuthenticationException("Refresh token đã bị revoke");
            }
        }

        // Lấy user từ token
        User user = refreshToken.getUser();

        // Kiểm tra trạng thái tài khoản
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AuthenticationException("Tài khoản chưa được kích hoạt");
        }

        // Tạo cặp token mới trước
        String newAccessToken = jwtTokenProvider.generateToken(user.getEmail());
        String newRefreshTokenString = jwtTokenProvider.generateRefreshToken(user.getEmail());

        // REVOKE token cũ và set replacedByToken (token rotation)
        refreshToken.revokeAndReplace(newRefreshTokenString);
        refreshTokenRepository.save(refreshToken);

        // Lưu refresh token mới vào database
        saveRefreshToken(user, newRefreshTokenString);

        return new TokenRefreshResponse(newAccessToken, newRefreshTokenString, "Bearer");
    }

    @Override
    @Transactional
    public void logout(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AuthenticationException("User không tồn tại"));
        
        // Revoke tất cả refresh tokens của user
        refreshTokenRepository.revokeAllUserTokens(user, new Date());
    }

    /**
     * Lưu refresh token vào database
     */
    private void saveRefreshToken(User user, String tokenString) {
        try {
            Date expiresAt = jwtTokenProvider.getExpirationDateFromToken(tokenString);
            
            RefreshToken refreshToken = new RefreshToken();
            refreshToken.setToken(tokenString);
            refreshToken.setUser(user);
            refreshToken.setExpiresAt(expiresAt);
            refreshToken.setRevoked(false);
            
            refreshTokenRepository.save(refreshToken);
        } catch (Exception e) {
            // Log error nhưng không throw để không ảnh hưởng đến login flow
            // Token vẫn được trả về cho client
            System.err.println("Error saving refresh token: " + e.getMessage());
        }
    }
    
    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        
        // Tìm user - không throw exception nếu không tìm thấy để tránh expose thông tin
        User user = userRepository.findByEmail(email).orElse(null);
        
        // Nếu user không tồn tại, vẫn trả về success để không expose thông tin
        // (Security best practice: không cho attacker biết email có tồn tại hay không)
        if (user == null) {
            log.warn("Forgot password request for non-existent email: {}", email);
            // Return silently - don't expose that email doesn't exist
            return;
        }
        
        // Kiểm tra trạng thái tài khoản
        if (user.getStatus() != UserStatus.ACTIVE) {
            log.warn("Forgot password request for inactive account: {}", email);
            // Return silently
            return;
        }
        
        // Xóa các token cũ của user (nếu có)
        passwordResetTokenRepository.deleteByUser(user);
        
        // Tạo token mới
        String token = generateSecureToken();
        
        // Tính toán expiry date (1 giờ từ bây giờ)
        Date expiryDate = new Date(System.currentTimeMillis() + (TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000L));
        
        // Lưu token vào database
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiryDate(expiryDate);
        resetToken.setUsed(false);
        passwordResetTokenRepository.save(resetToken);
        
        // Tạo reset URL
        String resetUrl = frontendUrl + "/reset-password/" + token;
        
        // Gửi email
        try {
            emailService.sendPasswordResetEmail(user.getEmail(), token, resetUrl);
            log.info("Password reset email sent successfully to: {}", email);
        } catch (RuntimeException e) {
            log.error("Error sending password reset email to {}: {}", email, e.getMessage(), e);
            // Xóa token nếu không gửi được email
            passwordResetTokenRepository.delete(resetToken);
            // Re-throw với message từ EmailService (đã có thông tin chi tiết)
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error sending password reset email to {}: {}", email, e.getMessage(), e);
            // Xóa token nếu không gửi được email
            passwordResetTokenRepository.delete(resetToken);
            throw new RuntimeException("Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau. Chi tiết: " + e.getMessage());
        }
    }
    
    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String token = request.getToken();
        String newPassword = request.getNewPassword();
        
        // Tìm token trong database
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new AuthenticationException("Token không hợp lệ hoặc đã hết hạn"));
        
        // Kiểm tra token có hợp lệ không
        if (!resetToken.isValid()) {
            if (resetToken.isExpired()) {
                throw new AuthenticationException("Token đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.");
            }
            if (resetToken.isUsed()) {
                throw new AuthenticationException("Token đã được sử dụng. Vui lòng yêu cầu đặt lại mật khẩu mới.");
            }
            throw new AuthenticationException("Token không hợp lệ");
        }
        
        // Lấy user
        User user = resetToken.getUser();
        
        // Kiểm tra trạng thái tài khoản
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AuthenticationException("Tài khoản chưa được kích hoạt");
        }
        
        // Cập nhật mật khẩu
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        // Đánh dấu token đã được sử dụng
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
        
        // Xóa tất cả các token cũ của user (cleanup)
        passwordResetTokenRepository.deleteByUser(user);
        
        log.info("Password reset successfully for user: {}", user.getEmail());
    }
    
    /**
     * Tạo secure random token
     */
    private String generateSecureToken() {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }
}


