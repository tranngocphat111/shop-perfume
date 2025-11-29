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

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        try {
            String jwt = getJwtFromRequest(request);
            String requestURI = request.getRequestURI();
            
            // Log for /orders/create to debug user_id issue
            if (requestURI != null && requestURI.contains("/orders/create")) {
                logger.info("🔵 [JWT Filter] Processing /orders/create request");
                logger.info("🔵 [JWT Filter] JWT token present: " + (jwt != null && !jwt.isEmpty()));
                logger.info("🔵 [JWT Filter] Request URI: " + requestURI);
            }
            
            // Log for admin endpoints to debug 401 errors
            if (requestURI != null && requestURI.contains("/admin/")) {
                logger.info("Processing admin request: " + request.getMethod() + " " + requestURI);
                logger.info("JWT token present: " + (jwt != null && !jwt.isEmpty()));
            }
            
            if (StringUtils.hasText(jwt)) {
                logger.debug("JWT token found in request");
                
                if (jwtTokenProvider.validateToken(jwt)) {
                    logger.debug("JWT token is valid");
                    String email = jwtTokenProvider.getEmailFromToken(jwt);
                    logger.debug("Extracted email from token: " + email);
                    
                    UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                    logger.debug("User loaded: " + userDetails.getUsername() + ", Authorities: " + userDetails.getAuthorities());
                    
                    // Log for admin endpoints
                    if (requestURI != null && requestURI.contains("/admin/")) {
                        logger.info("User: " + userDetails.getUsername() + ", Authorities: " + userDetails.getAuthorities());
                        boolean hasAdminRole = userDetails.getAuthorities().stream()
                                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
                        logger.info("Has ADMIN role: " + hasAdminRole);
                    }

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );

                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    logger.debug("Authentication set in SecurityContext for user: " + email);
                    
                    // Log for /orders/create
                    if (requestURI != null && requestURI.contains("/orders/create")) {
                        logger.info("✅ [JWT Filter] Authentication set in SecurityContext for user: " + email);
                    }
                } else {
                    logger.warn("JWT token validation failed for request: " + requestURI);
                }
            } else {
                logger.debug("No JWT token found in request: " + requestURI);
                if (requestURI != null && requestURI.contains("/admin/")) {
                    logger.warn("No JWT token found for admin request: " + requestURI);
                }
                // Log for /orders/create
                if (requestURI != null && requestURI.contains("/orders/create")) {
                    logger.info("⚠️ [JWT Filter] No JWT token found for /orders/create - will create guest order");
                }
            }
        } catch (Exception ex) {
            logger.error("Không thể set user authentication for request: " + request.getRequestURI(), ex);
            logger.error("Exception details: " + ex.getMessage(), ex);
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String requestURI = request.getRequestURI();
        String servletPath = request.getServletPath();
        String method = request.getMethod();
        
        // With context-path=/api, servletPath already excludes context path
        // Example: requestURI=/api/orders/create, servletPath=/orders/create (context-path already removed)
        // So we use servletPath directly, or requestURI if servletPath is empty
        String pathToCheck = (servletPath != null && !servletPath.isEmpty()) ? servletPath : requestURI;
        
        // Debug logging for auth endpoints
        if (requestURI != null && requestURI.contains("/auth/")) {
            logger.info("🔍 [JWT Filter] Checking auth endpoint - servletPath: " + servletPath + ", requestURI: " + requestURI + ", pathToCheck: " + pathToCheck + ", method: " + method);
        }
        
        // CRITICAL: Skip JWT filter for webhook endpoints FIRST
        // Check both servletPath (after context-path removal) and full requestURI
        boolean isWebhook = (pathToCheck != null && pathToCheck.startsWith("/webhooks/")) ||
                           (requestURI != null && (requestURI.startsWith("/api/webhooks/") || requestURI.startsWith("/webhooks/")));
        
        if (isWebhook) {
            logger.debug("Skipping JWT filter for webhook: servletPath=" + servletPath + ", requestURI=" + requestURI + ", pathToCheck=" + pathToCheck);
            return true;
        }
        
        // Skip JWT filter for public auth endpoints (login, register, refresh, forgot-password, reset-password)
        // But NOT for /auth/me (requires authentication)
        if ((pathToCheck != null && pathToCheck.startsWith("/auth/")) || 
            (requestURI != null && requestURI.startsWith("/api/auth/"))) {
            // Don't skip /auth/me - it needs authentication
            if ((pathToCheck != null && (pathToCheck.equals("/auth/me") || pathToCheck.endsWith("/auth/me"))) ||
                (requestURI != null && (requestURI.endsWith("/auth/me") || requestURI.contains("/auth/me")))) {
                logger.debug("JWT filter will process /auth/me - requires authentication");
                return false; // Process JWT filter for /auth/me
            }
            logger.debug("Skipping JWT filter for public auth endpoint: servletPath=" + servletPath + ", requestURI=" + requestURI + ", pathToCheck=" + pathToCheck);
            return true; // Skip for other auth endpoints
        }
        
        // Skip JWT filter for swagger/docs
        if (pathToCheck.startsWith("/swagger-ui") || pathToCheck.startsWith("/v3/api-docs") ||
            requestURI.startsWith("/api/swagger-ui") || requestURI.startsWith("/api/v3/api-docs")) {
            return true;
        }
        
        // KHÔNG skip filter cho /orders/create và /orders/my-orders
        // - Cần set authentication nếu user đã đăng nhập
        // - Endpoints này là permitAll, nhưng nếu có token thì vẫn set authentication
        // Skip JWT filter cho các public endpoints khác (guest checkout)
        if (pathToCheck.startsWith("/payment/check-qr") ||
            pathToCheck.matches("/orders/\\d+/cancel-timeout")) {
            return true;
        }
        
        // Skip JWT filter for GET requests on public endpoints (read-only)
        if ("GET".equalsIgnoreCase(method)) {
            boolean isPublicGetEndpoint = pathToCheck.startsWith("/products/") ||
                   pathToCheck.startsWith("/inventories/") ||
                   pathToCheck.startsWith("/brands/") ||
                   pathToCheck.startsWith("/categories/") ||
                   pathToCheck.startsWith("/suppliers/") ||
                   requestURI.startsWith("/api/products/") ||
                   requestURI.startsWith("/api/inventories/") ||
                   requestURI.startsWith("/api/brands/") ||
                   requestURI.startsWith("/api/categories/") ||
                   requestURI.startsWith("/api/suppliers/");
            
            if (isPublicGetEndpoint) {
                return true;
            }
        }
        
        // For POST, PUT, DELETE on admin endpoints - require authentication (don't skip filter)
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

