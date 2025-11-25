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
        String contextPath = request.getContextPath();
        
        // With context-path=/api, servletPath already excludes context path
        // Example: requestURI=/api/orders/create, servletPath=/orders/create (context-path already removed)
        // So we use servletPath directly, or requestURI if servletPath is empty
        String pathToCheck = (servletPath != null && !servletPath.isEmpty()) ? servletPath : requestURI;
        
        // Skip JWT filter for public endpoints
        // With context-path=/api, servletPath will be /orders/create (without /api prefix)
        // Controller has @RequestMapping("/orders"), so servletPath is /orders/create
        boolean shouldSkip = pathToCheck.startsWith("/auth/") ||
               pathToCheck.startsWith("/products/") ||
               pathToCheck.startsWith("/inventories/") ||
               pathToCheck.startsWith("/brands/") ||
               pathToCheck.startsWith("/categories/") ||
               pathToCheck.startsWith("/swagger-ui") ||
               pathToCheck.startsWith("/suppliers/") ||
               pathToCheck.startsWith("/v3/api-docs") ||
               pathToCheck.equals("/orders/create") ||
               pathToCheck.startsWith("/payment/check-qr") ||
               pathToCheck.matches("/orders/\\d+/cancel-timeout") ||
               pathToCheck.startsWith("/orders/my-orders") ||
               pathToCheck.startsWith("/webhooks/"); // Sepay webhook endpoint
        
        if (pathToCheck.contains("orders/create")) {
            logger.info("JWT Filter: requestURI=" + requestURI + ", servletPath=" + servletPath + 
                       ", contextPath=" + contextPath + ", pathToCheck=" + pathToCheck + ", shouldSkip=" + shouldSkip);
        }
        
        return shouldSkip;
    }


    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}

