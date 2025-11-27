package iuh.fit.server.dto.response;


import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String type = "Bearer";
    private int userId;
    private String name;
    private String email;
    private String role;
}

