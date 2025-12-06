package iuh.fit.server.security;

import iuh.fit.server.util.JwtTokenProvider;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

/**
 * Filter xác thực JWT token cho mỗi request
 * - Lấy token từ header Authorization
 * - Validate token
 * - Set authentication vào SecurityContext
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;

    // Protected auth endpoints that require authentication
    private static final Set<String> PROTECTED_AUTH_ENDPOINTS = Set.of(
            "/auth/me", "/auth/change-password", "/auth/update", "/auth/logout", "/auth/debug/auth-status"
    );

    // Public GET endpoints (read-only) - both prefix and exact match
    private static final Set<String> PUBLIC_GET_PREFIXES = Set.of(
            "/products", "/inventories", "/brands", "/categories", "/reviews/product", "/reviews/user"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        try {
            String jwt = getJwtFromRequest(request);
            String requestURI = request.getRequestURI();

            if (logger.isDebugEnabled()) {
                logger.debug("Processing request: " + requestURI + ", JWT present: " + (jwt != null));
            }

            if (StringUtils.hasText(jwt) && jwtTokenProvider.validateToken(jwt)) {
                String email = jwtTokenProvider.getEmailFromToken(jwt);
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);

                if (logger.isDebugEnabled()) {
                    logger.debug("Authentication set for user: " + email + ", roles: " + userDetails.getAuthorities());
                }
            }
        } catch (Exception ex) {
            logger.error("Cannot set user authentication: " + ex.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String requestURI = request.getRequestURI();
        String servletPath = request.getServletPath();
        String method = request.getMethod();

        // Use servletPath (excludes context-path) or fall back to requestURI
        String pathToCheck = StringUtils.hasText(servletPath) ? servletPath : requestURI;

        // 1. Skip for webhook endpoints
        if (isWebhookEndpoint(pathToCheck, requestURI)) {
            return true;
        }

        // 2. Handle auth endpoints
        if (isAuthEndpoint(pathToCheck, requestURI)) {
            // Protected auth endpoints need JWT filter
            if (isProtectedAuthEndpoint(pathToCheck, requestURI)) {
                return false;
            }
            // Other auth endpoints (login, register, refresh, etc.) are public
            return true;
        }

        // 3. Skip for Swagger/API docs
        if (isSwaggerEndpoint(pathToCheck, requestURI)) {
            return true;
        }

        // 4. Skip for specific public endpoints
        if (isPublicPaymentEndpoint(pathToCheck)) {
            return true;
        }

        // 5. Skip for public GET endpoints (products, categories, etc.)
        if ("GET".equalsIgnoreCase(method) && isPublicGetEndpoint(pathToCheck, requestURI)) {
            return true;
        }

        // All other requests need JWT filter processing
        return false;
    }

    private boolean isWebhookEndpoint(String pathToCheck, String requestURI) {
        return (pathToCheck != null && pathToCheck.startsWith("/webhooks/")) ||
                (requestURI != null && (requestURI.startsWith("/api/webhooks/") || requestURI.startsWith("/webhooks/")));
    }

    private boolean isAuthEndpoint(String pathToCheck, String requestURI) {
        return (pathToCheck != null && pathToCheck.startsWith("/auth/")) ||
                (requestURI != null && requestURI.startsWith("/api/auth/"));
    }

    private boolean isProtectedAuthEndpoint(String pathToCheck, String requestURI) {
        for (String endpoint : PROTECTED_AUTH_ENDPOINTS) {
            if ((pathToCheck != null && (pathToCheck.equals(endpoint) || pathToCheck.endsWith(endpoint))) ||
                    (requestURI != null && (requestURI.endsWith(endpoint) || requestURI.contains(endpoint)))) {
                return true;
            }
        }
        return false;
    }

    private boolean isSwaggerEndpoint(String pathToCheck, String requestURI) {
        return pathToCheck.startsWith("/swagger-ui") || pathToCheck.startsWith("/v3/api-docs") ||
                requestURI.startsWith("/api/swagger-ui") || requestURI.startsWith("/api/v3/api-docs");
    }

    private boolean isPublicPaymentEndpoint(String pathToCheck) {
        return pathToCheck.startsWith("/payment/check-qr") ||
                pathToCheck.matches("/orders/\\d+/cancel-timeout");
    }

    private boolean isPublicGetEndpoint(String pathToCheck, String requestURI) {
        for (String prefix : PUBLIC_GET_PREFIXES) {
            // Match exact path or path with suffix (e.g., /products or /products/123)
            if (pathToCheck.equals(prefix) || pathToCheck.startsWith(prefix + "/") ||
                requestURI.equals("/api" + prefix) || requestURI.startsWith("/api" + prefix + "/")) {
                return true;
            }
        }
        return false;
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
