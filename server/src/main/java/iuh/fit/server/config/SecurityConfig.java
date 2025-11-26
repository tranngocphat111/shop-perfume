package iuh.fit.server.config;

import iuh.fit.server.security.JwtAuthenticationEntryPoint;
import iuh.fit.server.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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
@EnableMethodSecurity
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
                     // CRITICAL: Webhook endpoints MUST be FIRST (before any other rules)
                    // Sepay webhook endpoint (must be public)
                    // Use custom matcher to handle both servletPath and requestURI
                    .requestMatchers(webhookMatcher).permitAll()
                    // Explicit permit for manual endpoint (backup)
                    .requestMatchers("/webhooks/sepay/manual", "/webhooks/sepay/test", "/webhooks/sepay/health").permitAll()
                    // Webhook logs endpoint - public for debugging (can be restricted later)
                    .requestMatchers("/webhooks/sepay/logs", "/webhooks/sepay/logs/**").permitAll()
                    
                    // CRITICAL: Guest checkout endpoints MUST be SECOND to ensure they are matched
                    // Note: context-path=/api, Controller has @RequestMapping("/orders"), so servletPath is /orders/create
                    .requestMatchers("/orders/create").permitAll()
                    .requestMatchers("/api/orders/create", "/api/orders/create/**").permitAll()
                    .requestMatchers("/payment/check-qr").permitAll()
                    .requestMatchers("/api/payment/check-qr", "/api/payment/check-qr/**").permitAll()
                    .requestMatchers("/payment/debug").permitAll()
                    .requestMatchers("/api/payment/debug", "/api/payment/debug/**").permitAll()
                    .requestMatchers("/orders/*/cancel-timeout").permitAll()
                    // Allow guest users to search orders by email
                    .requestMatchers("/orders/my-orders").permitAll()
                    
                    // Other public endpoints
                    .requestMatchers("/auth/**").permitAll()
                    .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                    
                    // Products - GET public (anyone can view), WRITE admin only
                    .requestMatchers(HttpMethod.GET, "/products/**").permitAll()
                    .requestMatchers(HttpMethod.POST, "/products/**").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.PUT, "/products/**").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.DELETE, "/products/**").hasRole("ADMIN")
                    
                    // Inventories - GET public (anyone can view), WRITE admin only
                    .requestMatchers(HttpMethod.GET, "/inventories/**").permitAll()
                    .requestMatchers(HttpMethod.POST, "/inventories/**").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.PUT, "/inventories/**").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.DELETE, "/inventories/**").hasRole("ADMIN")
                    
                    // Brands - GET public (anyone can view), WRITE admin only
                    .requestMatchers(HttpMethod.GET, "/brands/**").permitAll()
                    .requestMatchers(HttpMethod.POST, "/brands/**").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.PUT, "/brands/**").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.DELETE, "/brands/**").hasRole("ADMIN")
                    
                    // Categories - GET public (anyone can view), WRITE admin only
                    .requestMatchers(HttpMethod.GET, "/categories/**").permitAll()
                    .requestMatchers(HttpMethod.POST, "/categories/**").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.PUT, "/categories/**").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.DELETE, "/categories/**").hasRole("ADMIN")
                    
                    // Suppliers - Admin only (all methods)
                    .requestMatchers("/admin/suppliers/**").hasRole("ADMIN")

                    // Protected endpoints
                    .requestMatchers("/carts/**").authenticated()
                    .requestMatchers("/orders/**").authenticated()
                    .requestMatchers("/addresses/**").authenticated()
                    .requestMatchers("/users/me").authenticated()

                    // Admin endpoints
                    .requestMatchers("/admin/**").hasRole("ADMIN")

                    // All other requests require authentication
                    .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}

