package iuh.fit.server.config;

import iuh.fit.server.model.entity.Role;
import iuh.fit.server.model.entity.User;
import iuh.fit.server.model.enums.UserStatus;
import iuh.fit.server.repository.RoleRepository;
import iuh.fit.server.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        try {
            initializeAdminAccount();
        } catch (Exception e) {
            log.error("Error initializing admin account", e);
        }
    }

    private void initializeAdminAccount() {
        // Tạo các roles nếu chưa có
        initializeRoles();

        // Kiểm tra xem tài khoản admin đã tồn tại chưa
        if (userRepository.existsByEmail("shopperfume.admin@gmail.com")) {
            log.info("Admin account already exists");
            return;
        }

        // Lấy ADMIN role
        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseThrow(() -> new RuntimeException("ADMIN role not found"));

        // Tạo tài khoản admin
        User admin = new User();
        admin.setName("Administrator");
        admin.setEmail("shopperfume.admin@gmail.com");
        admin.setPasswordHash(passwordEncoder.encode("Admin@123"));
        admin.setPhone("0901234567");
        admin.setAddress("IUH");
        admin.setStatus(UserStatus.ACTIVE);
        admin.setRoles(Set.of(adminRole));

        userRepository.save(admin);

        log.info("===============================================");
        log.info("Admin account created successfully!");
        log.info("Email: admin@shopperfume.com");
        log.info("Password: Admin@123");
        log.info("Please change the password after first login");
        log.info("===============================================");
    }

    private void initializeRoles() {
        // Tạo ADMIN role nếu chưa có
        if (roleRepository.findByName("ADMIN").isEmpty()) {
            log.info("Creating ADMIN role");
            Role adminRole = new Role();
            adminRole.setName("ADMIN");
            roleRepository.save(adminRole);
        }

        // Tạo CUSTOMER role nếu chưa có
        if (roleRepository.findByName("CUSTOMER").isEmpty()) {
            log.info("Creating CUSTOMER role");
            Role customerRole = new Role();
            customerRole.setName("CUSTOMER");
            roleRepository.save(customerRole);
        }
    }
}

