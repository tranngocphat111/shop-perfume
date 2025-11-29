package iuh.fit.server.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordRequest {
    
    @Email(message = "Email không hợp lệ")
    @NotBlank(message = "Email không được để trống")
    private String email;
    
    // Auto-trim email to handle whitespace
    public void setEmail(String email) {
        this.email = email != null ? email.trim() : null;
    }
}

