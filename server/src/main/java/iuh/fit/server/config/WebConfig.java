package iuh.fit.server.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Configuration cho CORS và Web MVC
 * Hỗ trợ cả development và production (AWS)
 */
@Slf4j
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${cors.allowed.origins:http://localhost:3000,http://localhost:5173,https://shop-perfume.vercel.app}")
    private String allowedOrigins;
    
    /**
     * Parse and filter origins, removing "*" which cannot be used with allowCredentials(true)
     * This method ensures that even if environment variable contains "*", it will be filtered out
     */
    private List<String> parseAndFilterOrigins() {
        log.info("=== CORS Configuration ===");
        log.info("Raw CORS allowed origins from config: '{}'", allowedOrigins);
        
        // Check if the entire string is just "*" (with or without whitespace)
        if (allowedOrigins != null && allowedOrigins.trim().equals("*")) {
            log.error("CORS allowed origins is set to '*', which is not allowed with allowCredentials(true). Replacing with default origins.");
            allowedOrigins = "http://localhost:3000,https://shop-perfume.vercel.app";
        }
        
        // Parse and filter origins
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> {
                    // Filter out empty strings
                    if (origin.isEmpty()) {
                        log.debug("Skipping empty origin");
                        return false;
                    }
                    // Filter out "*" - this is critical!
                    if (origin.equals("*")) {
                        log.error("Found '*' in CORS origins list at position, removing it as it cannot be used with allowCredentials(true)");
                        return false;
                    }
                    return true;
                })
                .collect(Collectors.toList());
        
        // If no valid origins after filtering, use defaults
        if (origins.isEmpty()) {
            log.warn("No valid CORS origins found after filtering, using default origins");
            origins = Arrays.asList("http://localhost:3000", "https://shop-perfume.vercel.app");
        }
        
        log.info("Final CORS allowed origins ({}): {}", origins.size(), origins);
        log.info("=== End CORS Configuration ===");
        return origins;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        List<String> origins = parseAndFilterOrigins();
        
        log.info("Registering CORS mappings with {} origins", origins.size());
        registry.addMapping("/**")
                .allowedOriginPatterns(origins.toArray(new String[0]))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        log.info("Creating CorsConfigurationSource bean");
        CorsConfiguration configuration = new CorsConfiguration();
        
        List<String> origins = parseAndFilterOrigins();
        
        // CRITICAL: Use setAllowedOriginPatterns instead of setAllowedOrigins
        // This supports patterns and works with allowCredentials(true)
        try {
            configuration.setAllowedOriginPatterns(origins);
            log.info("Successfully set CORS allowed origin patterns: {}", origins);
        } catch (Exception e) {
            log.error("ERROR: Failed to set CORS origin patterns. Error: {}", e.getMessage());
            log.error("Origins that caused error: {}", origins);
            // Use safe defaults
            origins = Arrays.asList("http://localhost:3000", "https://shop-perfume.vercel.app");
            configuration.setAllowedOriginPatterns(origins);
            log.info("Using safe default origin patterns: {}", origins);
        }
        
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        log.info("CorsConfigurationSource created successfully");
        return source;
    }
}

