package iuh.fit.server.config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for Cloudinary image hosting service
 */
@Configuration
public class CloudinaryConfig {

    @Bean
    public Cloudinary cloudinary() {
        return new Cloudinary(ObjectUtils.asMap(
                "cloud_name", "piin",
                "api_key", "585654661337682",
                "api_secret", "5pBw8CYXEFVjt67sZLAJjilaPEg"
        ));
    }
}
