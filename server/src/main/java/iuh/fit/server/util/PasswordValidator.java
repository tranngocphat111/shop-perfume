package iuh.fit.server.util;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Utility class để validate password strength (SIMPLIFIED for academic project)
 */
public class PasswordValidator {
    
    private static final int MIN_LENGTH = 6;  // Giảm từ 8 xuống 6
    private static final int MAX_LENGTH = 50;
    
    // Password patterns - CHỈ CẦN uppercase và digit
    private static final Pattern UPPERCASE_PATTERN = Pattern.compile("[A-Z]");
    private static final Pattern DIGIT_PATTERN = Pattern.compile("[0-9]");
    
    /**
     * Validate password với requirements đơn giản
     * - Tối thiểu 6 ký tự
     * - Có ít nhất 1 chữ hoa
     * - Có ít nhất 1 chữ số
     */
    public static List<String> validate(String password) {
        List<String> errors = new ArrayList<>();
        
        if (password == null || password.isEmpty()) {
            errors.add("Mật khẩu không được để trống");
            return errors;
        }
        
        // Check length
        if (password.length() < MIN_LENGTH) {
            errors.add("Mật khẩu phải có ít nhất " + MIN_LENGTH + " ký tự");
        }
        
        if (password.length() > MAX_LENGTH) {
            errors.add("Mật khẩu không được vượt quá " + MAX_LENGTH + " ký tự");
        }
        
        // Check for uppercase letter
        if (!UPPERCASE_PATTERN.matcher(password).find()) {
            errors.add("Mật khẩu phải chứa ít nhất một chữ cái viết hoa");
        }
        
        // Check for digit
        if (!DIGIT_PATTERN.matcher(password).find()) {
            errors.add("Mật khẩu phải chứa ít nhất một chữ số");
        }
        
        return errors;
    }
    
    /**
     * Check if password is strong enough
     */
    public static boolean isStrong(String password) {
        return validate(password).isEmpty();
    }
}

