package iuh.fit.server.dto.request;

import lombok.Data;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
public class RegisterRequest {
    @NotBlank(message = "Tên không được để trống")
    @Size(min = 2, max = 100, message = "Tên phải từ 2-100 ký tự")
    private String name;

    @Email(message = "Email không hợp lệ")
    @NotBlank(message = "Email không được để trống")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, max = 50, message = "Mật khẩu phải từ 6-50 ký tự")
    private String password;
    
    // Auto-trim fields to handle whitespace
    public void setName(String name) {
        this.name = name != null ? name.trim() : null;
    }
    
    public void setEmail(String email) {
        this.email = email != null ? email.trim() : null;
    }
    
    // Phone and address removed - use Address entity instead
    // Users can add addresses after registration through the Address management feature
}
