package iuh.fit.server.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderCreateRequest {
    
    @NotBlank(message = "Họ và tên không được để trống")
    @Size(min = 2, max = 100, message = "Họ và tên phải từ 2-100 ký tự")
    @Pattern(regexp = "^[\\p{L}\\s]+$", message = "Họ và tên chỉ được chứa chữ cái và khoảng trắng")
    private String fullName;
    
    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(\\+84|0)[0-9]{9,10}$", message = "Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678)")
    private String phone;
    
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    @Size(max = 100, message = "Email không được quá 100 ký tự")
    private String email;
    
    @NotBlank(message = "Tỉnh/Thành phố không được để trống")
    @Size(max = 100, message = "Tỉnh/Thành phố không được quá 100 ký tự")
    private String city;
    
    @NotBlank(message = "Quận/Huyện không được để trống")
    @Size(max = 100, message = "Quận/Huyện không được quá 100 ký tự")
    private String district;
    
    @NotBlank(message = "Xã/Phường/Thị trấn không được để trống")
    @Size(max = 100, message = "Xã/Phường/Thị trấn không được quá 100 ký tự")
    private String ward;
    
    @NotBlank(message = "Địa chỉ cụ thể không được để trống")
    @Size(max = 255, message = "Địa chỉ không được quá 255 ký tự")
    private String address;
    
    @Size(max = 500, message = "Ghi chú không được quá 500 ký tự")
    private String note;
    
    @NotBlank(message = "Phương thức thanh toán không được để trống")
    @Pattern(regexp = "^(cod|qr-payment|qr_code)$", message = "Phương thức thanh toán không hợp lệ. Chỉ chấp nhận: cod, qr-payment, qr_code")
    private String paymentMethod;
    
    @NotNull(message = "Danh sách sản phẩm không được để trống")
    @NotEmpty(message = "Danh sách sản phẩm không được rỗng")
    @Valid
    private List<OrderItemRequest> cartItems;
    
    @NotNull(message = "Tổng tiền không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Tổng tiền phải lớn hơn 0")
    private Double totalAmount;
    
    // Số tiền đã được giảm (optional - tính từ frontend khi áp dụng coupon)
    private Double discountAmount;
}

