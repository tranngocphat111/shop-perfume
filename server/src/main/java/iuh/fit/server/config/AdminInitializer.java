package iuh.fit.server.config;

import iuh.fit.server.model.entity.Role;
import iuh.fit.server.model.entity.User;
import iuh.fit.server.model.enums.UserStatus;
import iuh.fit.server.repository.RoleRepository;
import iuh.fit.server.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * AdminInitializer - Tạo tài khoản admin tự động
 * 
 * ⚠️ BẢO MẬT:
 * - Chỉ chạy khi ADMIN_INIT_ENABLED=true
 * - Sử dụng environment variables cho email và password
 * - KHÔNG log password ra console
 * - Chỉ chạy một lần (nếu admin đã tồn tại thì skip)
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "admin.init.enabled", havingValue = "true", matchIfMissing = false)
public class AdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.init.email:}")
    private String adminEmail;

    @Value("${admin.init.password:}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        try {
            // Validate environment variables
            if (adminEmail == null || adminEmail.isEmpty()) {
                log.warn("⚠️ ADMIN_INIT_EMAIL is not set. Skipping admin initialization.");
                return;
            }

            if (adminPassword == null || adminPassword.isEmpty()) {
                log.warn("⚠️ ADMIN_INIT_PASSWORD is not set. Skipping admin initialization.");
                return;
            }

            // Validate password strength
            if (adminPassword.length() < 8) {
                log.error("❌ Admin password must be at least 8 characters long. Skipping admin initialization.");
                return;
            }

            initializeAdminAccount();
        } catch (Exception e) {
            log.error("Error initializing admin account", e);
        }
    }

    private void initializeAdminAccount() {
        // Tạo các roles nếu chưa có
        initializeRoles();

        // Kiểm tra xem tài khoản admin đã tồn tại chưa
        if (userRepository.existsByEmail(adminEmail)) {
            log.info("✅ Admin account already exists: {}", adminEmail);
            return;
        }

        // Lấy ADMIN role
        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseThrow(() -> new RuntimeException("ADMIN role not found"));

        // Tạo tài khoản admin
        User admin = new User();
        admin.setName("Administrator");
        admin.setEmail(adminEmail);
        admin.setPasswordHash(passwordEncoder.encode(adminPassword));
        admin.setProvider("LOCAL");
        admin.setStatus(UserStatus.ACTIVE);
        admin.setRoles(Set.of(adminRole));

        userRepository.save(admin);

        log.info("===============================================");
        log.info("✅ Admin account created successfully!");
        log.info("📧 Email: {}", adminEmail);
        log.info("🔒 Password: [HIDDEN - Set via ADMIN_INIT_PASSWORD]");
        log.info("⚠️  IMPORTANT: Change password after first login!");
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

