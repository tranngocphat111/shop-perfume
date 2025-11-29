package iuh.fit.server.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * Xử lý khi user chưa authenticated nhưng cố truy cập protected resource
 */
@Component
@Slf4j
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {

        String servletPath = request.getServletPath();
        String requestURI = request.getRequestURI();
        String contextPath = request.getContextPath();
        String method = request.getMethod();
        
        log.error("❌ Unauthorized error - method: {}, servletPath: {}, requestURI: {}, contextPath: {}, message: {}", 
                method, servletPath, requestURI, contextPath, authException.getMessage());
        
        // Log warning if this is a public endpoint that shouldn't require auth
        if (requestURI != null && (requestURI.contains("/auth/forgot-password") || 
            requestURI.contains("/auth/reset-password") ||
            requestURI.contains("/auth/login") ||
            requestURI.contains("/auth/register"))) {
            log.warn("⚠️ WARNING: Public endpoint {} is being blocked! Check SecurityConfig.", requestURI);
        }

        response.setContentType("application/json;charset=UTF-8");
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", "Unauthorized");
        errorResponse.put("message", "Bạn cần đăng nhập để truy cập tài nguyên này");
        errorResponse.put("path", servletPath);
        errorResponse.put("requestURI", requestURI);
        errorResponse.put("timestamp", System.currentTimeMillis());

        ObjectMapper mapper = new ObjectMapper();
        mapper.writeValue(response.getOutputStream(), errorResponse);
    }
}

