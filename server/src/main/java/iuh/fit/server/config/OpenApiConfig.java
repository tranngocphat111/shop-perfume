package iuh.fit.server.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger/OpenAPI Configuration
 * Access at: http://localhost:8080/api/swagger-ui.html
 */
@Configuration
public class OpenApiConfig {


    @Bean
    public OpenAPI openAPI() {
        Info infomation = new Info()
                .title("E-Commerce API")
                .version("1.0")
                .description("REST API cho hệ thống E-Commerce");
        return new OpenAPI()
                .info(infomation)
                .addSecurityItem(new SecurityRequirement().addList("BearerAuth"))
                .components(new Components()
                        .addSecuritySchemes("BearerAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                        )
                );
    }
}

