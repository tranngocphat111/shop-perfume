package iuh.fit.server.services;

import iuh.fit.server.dto.request.LoginRequest;
import iuh.fit.server.dto.request.RegisterRequest;
import iuh.fit.server.dto.response.AuthResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);
}
