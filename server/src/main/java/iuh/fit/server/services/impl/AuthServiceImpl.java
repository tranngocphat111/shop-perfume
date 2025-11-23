package iuh.fit.server.services.impl;

import iuh.fit.server.dto.request.LoginRequest;
import iuh.fit.server.dto.request.RegisterRequest;
import iuh.fit.server.dto.response.AuthResponse;
import iuh.fit.server.exception.AuthenticationException;
import iuh.fit.server.exception.RegistrationException;
import iuh.fit.server.services.AuthService;

import iuh.fit.server.model.entity.User;
import iuh.fit.server.model.entity.Role;
import iuh.fit.server.model.enums.UserStatus;
import iuh.fit.server.repository.UserRepository;
import iuh.fit.server.repository.RoleRepository;
import iuh.fit.server.util.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService{

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RegistrationException("Email đã tồn tại");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setAddress(request.getAddress());
        user.setStatus(UserStatus.ACTIVE);

        Role customerRole = roleRepository.findByName("CUSTOMER")
                .orElseThrow(() -> new RegistrationException("Role CUSTOMER không tồn tại"));

        Set<Role> roles = new HashSet<>();
        roles.add(customerRole);
        user.setRoles(roles);

        user = userRepository.save(user);

        String token = jwtTokenProvider.generateToken(user.getEmail());

        return new AuthResponse(
                token,
                "Bearer",
                user.getUserId(),
                user.getName(),
                user.getEmail(),
                "CUSTOMER"
        );
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AuthenticationException("Email hoặc mật khẩu không đúng"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AuthenticationException("Email hoặc mật khẩu không đúng");
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AuthenticationException("Tài khoản chưa được kích hoạt");
        }

        String token = jwtTokenProvider.generateToken(user.getEmail());

        // Lấy role đầu tiên từ set roles
        String roleName = user.getRoles().stream()
                .map(Role::getName)
                .findFirst()
                .orElse("CUSTOMER");

        return new AuthResponse(
                token,
                "Bearer",
                user.getUserId(),
                user.getName(),
                user.getEmail(),
                roleName
        );
    }
}

