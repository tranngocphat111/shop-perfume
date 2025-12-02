package iuh.fit.server.util;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.ParseException;
import java.util.Date;

/**
 * Utility class để tạo và validate JWT token
 */
@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${jwt.secret:mySecretKeyForJWTTokenGenerationAndValidation123456}")
    private String jwtSecret;

    @Value("${jwt.expiration:86400000}") // 24 hours
    private long jwtExpiration;

    @Value("${jwt.refresh-expiration:604800000}") // 7 days
    private long jwtRefreshExpiration;

    /**
     * Tạo JWT token từ email
     */
    public String generateToken(String email) {
        try {
            // Validate JWT secret
            if (jwtSecret == null || jwtSecret.isEmpty()) {
                throw new IllegalStateException("JWT secret key is not configured. Please set JWT_SECRET environment variable.");
            }
            
            // HS512 requires exactly 64 bytes (512 bits)
            byte[] secretBytes = prepareSecretKey(jwtSecret);
            
            Date now = new Date();
            Date expiryDate = new Date(now.getTime() + jwtExpiration);

            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .subject(email)
                    .issueTime(now)
                    .expirationTime(expiryDate)
                    .issuer("shop-perfume")
                    .build();

            SignedJWT signedJWT = new SignedJWT(
                    new JWSHeader(JWSAlgorithm.HS512),
                    claimsSet
            );

            JWSSigner signer = new MACSigner(secretBytes);
            signedJWT.sign(signer);

            return signedJWT.serialize();
        } catch (JOSEException e) {
            log.error("Error generating JWT token for email: {}. Error: {} - {}", email, e.getMessage(), e.getClass().getName(), e);
            throw new RuntimeException("Không thể tạo JWT token: " + e.getMessage(), e);
        } catch (IllegalStateException e) {
            log.error("JWT configuration error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error generating JWT token for email: {}. Error: {} - {}", email, e.getMessage(), e.getClass().getName(), e);
            throw new RuntimeException("Không thể tạo JWT token: " + e.getMessage(), e);
        }
    }
    
    /**
     * Chuẩn bị secret key cho HS512 (cần chính xác 64 bytes)
     * Nếu secret key ngắn hơn 64 bytes, sử dụng SHA-256 hash để tạo 32 bytes, sau đó duplicate để có 64 bytes
     * Nếu secret key dài hơn 64 bytes, lấy 64 bytes đầu tiên
     */
    private byte[] prepareSecretKey(String secret) {
        try {
            byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
            
            if (secretBytes.length == 64) {
                return secretBytes;
            } else if (secretBytes.length < 64) {
                log.warn("JWT secret key is too short ({} bytes). HS512 requires 64 bytes. Using SHA-256 hash to generate 64 bytes.", secretBytes.length);
                // Sử dụng SHA-256 để hash secret key thành 32 bytes, sau đó duplicate để có 64 bytes
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                byte[] hash = digest.digest(secretBytes);
                // Duplicate hash để có 64 bytes
                byte[] result = new byte[64];
                System.arraycopy(hash, 0, result, 0, 32);
                System.arraycopy(hash, 0, result, 32, 32);
                return result;
            } else {
                log.warn("JWT secret key is too long ({} bytes). HS512 requires 64 bytes. Using first 64 bytes.", secretBytes.length);
                // Lấy 64 bytes đầu tiên
                byte[] result = new byte[64];
                System.arraycopy(secretBytes, 0, result, 0, 64);
                return result;
            }
        } catch (Exception e) {
            log.error("Error preparing secret key: {}", e.getMessage(), e);
            // Fallback: sử dụng cách cũ (padding)
            byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
            byte[] paddedSecret = new byte[64];
            System.arraycopy(secretBytes, 0, paddedSecret, 0, Math.min(secretBytes.length, 64));
            for (int i = secretBytes.length; i < 64; i++) {
                paddedSecret[i] = secretBytes[i % secretBytes.length];
            }
            return paddedSecret;
        }
    }

    /**
     * Lấy email từ JWT token
     */
    public String getEmailFromToken(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            return signedJWT.getJWTClaimsSet().getSubject();
        } catch (ParseException e) {
            log.error("Error parsing token", e);
            throw new RuntimeException("Token không hợp lệ", e);
        }
    }

    /**
     * Extract username từ token (alias cho getEmailFromToken)
     */
    public String extractUsername(String token) {
        return getEmailFromToken(token);
    }

    /**
     * Validate JWT token
     */
    public boolean validateToken(String token) {
        try {
            if (jwtSecret == null || jwtSecret.isEmpty()) {
                log.error("JWT secret key is not configured");
                return false;
            }
            
            // HS512 requires exactly 64 bytes (512 bits)
            byte[] secretBytes = prepareSecretKey(jwtSecret);
            
            SignedJWT signedJWT = SignedJWT.parse(token);
            JWSVerifier verifier = new MACVerifier(secretBytes);

            if (!signedJWT.verify(verifier)) {
                log.warn("JWT signature verification failed");
                return false;
            }

            Date expirationTime = signedJWT.getJWTClaimsSet().getExpirationTime();
            if (expirationTime.before(new Date())) {
                log.warn("JWT token has expired");
                return false;
            }

            return true;
        } catch (Exception e) {
            log.error("JWT token validation failed", e);
            return false;
        }
    }

    /**
     * Validate token với UserDetails
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            String email = getEmailFromToken(token);
            return email.equals(userDetails.getUsername()) && validateToken(token);
        } catch (Exception e) {
            log.error("Token validation with UserDetails failed", e);
            return false;
        }
    }

    /**
     * Lấy thời gian hết hạn từ token
     */
    public Date getExpirationDateFromToken(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            return signedJWT.getJWTClaimsSet().getExpirationTime();
        } catch (ParseException e) {
            log.error("Error getting expiration date from token", e);
            throw new RuntimeException("Không thể lấy expiration date từ token", e);
        }
    }

    /**
     * Tạo refresh token từ email
     * Refresh token có thời gian sống lâu hơn access token (7 ngày)
     */
    public String generateRefreshToken(String email) {
        try {
            // Validate JWT secret
            if (jwtSecret == null || jwtSecret.isEmpty()) {
                throw new IllegalStateException("JWT secret key is not configured. Please set JWT_SECRET environment variable.");
            }
            
            // HS512 requires exactly 64 bytes (512 bits)
            byte[] secretBytes = prepareSecretKey(jwtSecret);
            
            Date now = new Date();
            Date expiryDate = new Date(now.getTime() + jwtRefreshExpiration);

            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .subject(email)
                    .issueTime(now)
                    .expirationTime(expiryDate)
                    .issuer("shop-perfume")
                    .claim("type", "refresh") // Đánh dấu đây là refresh token
                    .build();

            SignedJWT signedJWT = new SignedJWT(
                    new JWSHeader(JWSAlgorithm.HS512),
                    claimsSet
            );

            JWSSigner signer = new MACSigner(secretBytes);
            signedJWT.sign(signer);

            return signedJWT.serialize();
        } catch (JOSEException e) {
            log.error("Error generating refresh token for email: {}. Error: {} - {}", email, e.getMessage(), e.getClass().getName(), e);
            throw new RuntimeException("Không thể tạo refresh token: " + e.getMessage(), e);
        } catch (IllegalStateException e) {
            log.error("JWT configuration error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error generating refresh token for email: {}. Error: {} - {}", email, e.getMessage(), e.getClass().getName(), e);
            throw new RuntimeException("Không thể tạo refresh token: " + e.getMessage(), e);
        }
    }

    /**
     * Validate refresh token
     */
    public boolean validateRefreshToken(String token) {
        try {
            if (jwtSecret == null || jwtSecret.isEmpty()) {
                log.error("JWT secret key is not configured");
                return false;
            }
            
            // HS512 requires exactly 64 bytes (512 bits)
            byte[] secretBytes = prepareSecretKey(jwtSecret);
            
            SignedJWT signedJWT = SignedJWT.parse(token);
            JWSVerifier verifier = new MACVerifier(secretBytes);

            if (!signedJWT.verify(verifier)) {
                log.warn("Refresh token signature verification failed");
                return false;
            }

            // Kiểm tra đây có phải refresh token không
            String tokenType = signedJWT.getJWTClaimsSet().getStringClaim("type");
            if (!"refresh".equals(tokenType)) {
                log.warn("Token is not a refresh token");
                return false;
            }

            // Kiểm tra expiration
            Date expirationTime = signedJWT.getJWTClaimsSet().getExpirationTime();
            if (expirationTime.before(new Date())) {
                log.warn("Refresh token has expired");
                return false;
            }

            return true;
        } catch (Exception e) {
            log.error("Refresh token validation failed", e);
            return false;
        }
    }
}
