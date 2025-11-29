package iuh.fit.server.config;

import iuh.fit.server.security.JwtAuthenticationEntryPoint;
import iuh.fit.server.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(
    prePostEnabled = true,  // Enable @PreAuthorize and @PostAuthorize
    securedEnabled = true,   // Enable @Secured
    jsr250Enabled = true    // Enable @RolesAllowed (JSR-250)
)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final JwtAuthenticationEntryPoint authenticationEntryPoint;
    private final UserDetailsService userDetailsService;
    private final CorsConfigurationSource corsConfigurationSource;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        // Custom matcher for webhook endpoints - works with context-path=/api
        RequestMatcher webhookMatcher = new RequestMatcher() {
            @Override
            public boolean matches(jakarta.servlet.http.HttpServletRequest request) {
                String servletPath = request.getServletPath();
                String requestURI = request.getRequestURI();
                return (servletPath != null && servletPath.startsWith("/webhooks/")) ||
                       (requestURI != null && (requestURI.startsWith("/api/webhooks/") || requestURI.startsWith("/webhooks/")));
            }
        };
        
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exception ->
                exception.authenticationEntryPoint(authenticationEntryPoint))
            .authorizeHttpRequests(auth -> auth
                    // ========== PUBLIC ENDPOINTS (No authentication required) ==========
                    
                    // Error handling endpoints - must be public
                    .requestMatchers("/error", "/api/error").permitAll()
                    
                    // Webhooks - must be public for external services
                    .requestMatchers(webhookMatcher).permitAll()
                    .requestMatchers("/webhooks/sepay/manual", "/webhooks/sepay/test", "/webhooks/sepay/health").permitAll()
                    .requestMatchers("/webhooks/sepay/logs", "/webhooks/sepay/logs/**").permitAll()
                    
                    // Authentication endpoints - ALL public except /auth/me
                    // Note: Order matters - specific paths before wildcards
                    .requestMatchers("/api/auth/me", "/auth/me").authenticated() // /auth/me requires authentication
                    .requestMatchers("/api/auth/**", "/auth/**").permitAll() // All other auth endpoints are public
                    
                    // Guest checkout - allow public access
                    .requestMatchers("/orders/create").permitAll()
                    .requestMatchers("/api/orders/create", "/api/orders/create/**").permitAll()
                    .requestMatchers("/orders/*/cancel-timeout").permitAll()
                    .requestMatchers("/orders/my-orders").permitAll() // Guest can search orders by email
                    
                    // Payment endpoints - public for guest checkout
                    .requestMatchers("/payment/check-qr").permitAll()
                    .requestMatchers("/api/payment/check-qr", "/api/payment/check-qr/**").permitAll()
                    .requestMatchers("/payment/debug").permitAll()
                    .requestMatchers("/api/payment/debug", "/api/payment/debug/**").permitAll()
                    
                    // Public read-only endpoints
                    .requestMatchers("/products/**").permitAll() // GET public, POST/PUT/DELETE protected by @PreAuthorize
                    .requestMatchers("/inventories/**").permitAll() // GET public, PUT protected by @PreAuthorize
                    .requestMatchers("/brands/**").permitAll() // GET public
                    .requestMatchers("/categories/**").permitAll() // GET public
                    
                    // Swagger/API docs
                    .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()

                    // Protected endpoints
                    .requestMatchers("/carts/**").authenticated()
                    .requestMatchers("/orders/**").authenticated()
                    .requestMatchers("/addresses/**").authenticated()
                    .requestMatchers("/users/me").authenticated()
                    .requestMatchers("/coupons/**").authenticated() // Coupon endpoints (loyalty points system)

                    // ========== ADMIN ENDPOINTS (Require ADMIN role) ==========
                    // Note: Method-level @PreAuthorize provides additional granular control
                    .requestMatchers("/admin/**").hasRole("ADMIN") // All admin endpoints
                    .requestMatchers("/orders/size", "/orders/totalRevenue").hasRole("ADMIN") // Admin statistics

                    // ========== DEFAULT: Require authentication ==========
                    .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}

