package iuh.fit.server.util;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/**
 * Utility class for managing HTTP-only cookies for JWT tokens
 * Provides secure cookie handling for authentication
 */
@Component
public class CookieUtil {

    public static final String ACCESS_TOKEN_COOKIE_NAME = "access_token";
    public static final String REFRESH_TOKEN_COOKIE_NAME = "refresh_token";

    @Value("${jwt.access-token.expiration:86400000}") // 24 hours default
    private long accessTokenExpiration;

    @Value("${jwt.refresh-token.expiration:604800000}") // 7 days default
    private long refreshTokenExpiration;

    @Value("${app.cookie.secure:false}") // true in production (HTTPS)
    private boolean secureCookie;

    @Value("${app.cookie.same-site:Lax}") // Lax, Strict, or None
    private String sameSite;

    @Value("${app.cookie.domain:}") // Empty for localhost
    private String cookieDomain;

    /**
     * Create HTTP-only cookie for access token
     */
    public ResponseCookie createAccessTokenCookie(String token) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(ACCESS_TOKEN_COOKIE_NAME, token)
                .httpOnly(true)
                .secure(secureCookie)
                .path("/")
                .maxAge(accessTokenExpiration / 1000) // Convert ms to seconds
                .sameSite(sameSite);

        if (cookieDomain != null && !cookieDomain.isEmpty()) {
            builder.domain(cookieDomain);
        }

        return builder.build();
    }

    /**
     * Create HTTP-only cookie for refresh token
     */
    public ResponseCookie createRefreshTokenCookie(String token) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, token)
                .httpOnly(true)
                .secure(secureCookie)
                .path("/api/auth") // Only sent to auth endpoints
                .maxAge(refreshTokenExpiration / 1000)
                .sameSite(sameSite);

        if (cookieDomain != null && !cookieDomain.isEmpty()) {
            builder.domain(cookieDomain);
        }

        return builder.build();
    }

    /**
     * Create cookie to clear access token (logout)
     */
    public ResponseCookie createAccessTokenClearCookie() {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(ACCESS_TOKEN_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(secureCookie)
                .path("/")
                .maxAge(0)
                .sameSite(sameSite);

        if (cookieDomain != null && !cookieDomain.isEmpty()) {
            builder.domain(cookieDomain);
        }

        return builder.build();
    }

    /**
     * Create cookie to clear refresh token (logout)
     */
    public ResponseCookie createRefreshTokenClearCookie() {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(secureCookie)
                .path("/api/auth")
                .maxAge(0)
                .sameSite(sameSite);

        if (cookieDomain != null && !cookieDomain.isEmpty()) {
            builder.domain(cookieDomain);
        }

        return builder.build();
    }

    /**
     * Get access token from request cookies
     */
    public String getAccessTokenFromCookies(HttpServletRequest request) {
        return getCookieValue(request, ACCESS_TOKEN_COOKIE_NAME);
    }

    /**
     * Get refresh token from request cookies
     */
    public String getRefreshTokenFromCookies(HttpServletRequest request) {
        return getCookieValue(request, REFRESH_TOKEN_COOKIE_NAME);
    }

    /**
     * Get cookie value by name
     */
    private String getCookieValue(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (name.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    /**
     * Add cookies to response
     */
    public void addCookiesToResponse(HttpServletResponse response, String accessToken, String refreshToken) {
        response.addHeader("Set-Cookie", createAccessTokenCookie(accessToken).toString());
        response.addHeader("Set-Cookie", createRefreshTokenCookie(refreshToken).toString());
    }

    /**
     * Clear auth cookies from response
     */
    public void clearCookiesFromResponse(HttpServletResponse response) {
        response.addHeader("Set-Cookie", createAccessTokenClearCookie().toString());
        response.addHeader("Set-Cookie", createRefreshTokenClearCookie().toString());
    }
}

