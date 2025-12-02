package iuh.fit.server.services;

import iuh.fit.server.dto.request.ForgotPasswordRequest;
import iuh.fit.server.dto.request.LoginRequest;
import iuh.fit.server.dto.request.RegisterRequest;
import iuh.fit.server.dto.request.RefreshTokenRequest;
import iuh.fit.server.dto.request.ResetPasswordRequest;
import iuh.fit.server.dto.request.UpdateUserRequest;
import iuh.fit.server.dto.request.ChangePasswordRequest;
import iuh.fit.server.dto.response.AuthResponse;
import iuh.fit.server.dto.response.TokenRefreshResponse;
import iuh.fit.server.dto.response.UserInfoResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    TokenRefreshResponse refreshToken(RefreshTokenRequest request);

    void logout(String email);
    
    void forgotPassword(ForgotPasswordRequest request);
    
    void resetPassword(ResetPasswordRequest request);
    
    UserInfoResponse updateProfile(String email, UpdateUserRequest request);
    
    void changePassword(String email, ChangePasswordRequest request);

    UserInfoResponse getUserInfo(String email);

    AuthResponse signInWithGoogle(String googleIdToken);
}
