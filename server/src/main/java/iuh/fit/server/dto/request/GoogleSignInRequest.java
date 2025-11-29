package iuh.fit.server.dto.request;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class GoogleSignInRequest {
    @NotBlank(message = "Google ID token không được để trống")
    private String idToken;
}
