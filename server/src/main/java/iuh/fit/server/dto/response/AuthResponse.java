package iuh.fit.server.dto.response;


import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String refreshToken;
    private String type = "Bearer";
    private int userId;
    private String name;
    private String email;
    private String role;

    // Constructor không có refreshToken (backward compatibility)
    public AuthResponse(String token, String type, int userId, String name, String email, String role) {
        this.token = token;
        this.type = type;
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.role = role;
    }
}

