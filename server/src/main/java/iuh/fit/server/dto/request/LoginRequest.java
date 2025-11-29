package iuh.fit.server.dto.request;

import lombok.Data;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Data
public class LoginRequest {
    @Email(message = "Email không hợp lệ")
    @NotBlank(message = "Email không được để trống")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    private String password;
    
    // Auto-trim email to handle whitespace
    public void setEmail(String email) {
        this.email = email != null ? email.trim() : null;
    }
}
