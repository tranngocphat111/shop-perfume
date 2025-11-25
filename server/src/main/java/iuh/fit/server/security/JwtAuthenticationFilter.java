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
            }
        } catch (Exception ex) {
            logger.error("Không thể set user authentication", ex);
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
        
        // Always skip JWT filter for auth endpoints
        if (pathToCheck.startsWith("/auth/") || requestURI.startsWith("/api/auth/")) {
            return true;
        }
        
        // Skip JWT filter for swagger/docs
        if (pathToCheck.startsWith("/swagger-ui") || pathToCheck.startsWith("/v3/api-docs") ||
            requestURI.startsWith("/api/swagger-ui") || requestURI.startsWith("/api/v3/api-docs")) {
            return true;
        }
        
        // Skip JWT filter for public order/payment endpoints (guest checkout)
        if (pathToCheck.equals("/orders/create") || pathToCheck.startsWith("/payment/check-qr") ||
            pathToCheck.matches("/orders/\\d+/cancel-timeout") || pathToCheck.startsWith("/webhooks/")) {
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

