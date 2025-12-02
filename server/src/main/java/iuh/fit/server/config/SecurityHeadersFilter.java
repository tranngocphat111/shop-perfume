package iuh.fit.server.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter để cấu hình security headers, đặc biệt là COOP header
 * để hỗ trợ Google Sign In popup hoạt động đúng
 */
@Component
@Order(1) // Chạy trước các filter khác
@Slf4j
public class SecurityHeadersFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        
        // Set Cross-Origin-Opener-Policy để hỗ trợ Google Sign In popup
        // "same-origin-allow-popups" cho phép popup từ cùng origin và cross-origin popups
        // Điều này cần thiết cho Google Sign In popup hoạt động
        response.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
        
        // Set các security headers khác (tùy chọn)
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("X-Frame-Options", "SAMEORIGIN");
        response.setHeader("X-XSS-Protection", "1; mode=block");
        
        // Không set Strict-Transport-Security ở đây vì nó chỉ nên set cho HTTPS
        // Có thể set trong production thông qua reverse proxy hoặc load balancer
        
        filterChain.doFilter(request, response);
    }
}
