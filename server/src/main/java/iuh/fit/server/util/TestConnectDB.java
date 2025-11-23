package iuh.fit.server.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class TestConnectDB {
    public static void main(String[] args) {
        // 1. SỬA THÔNG TIN CỦA BẠN VÀO ĐÂY
        String url = "jdbc:mariadb://shop-perfume-db.cpggs0eyg7pm.ap-southeast-1.rds.amazonaws.com:3306/shopnuochoa";
        String user = "admin";
        String password = "Ngocphat123"; // Nhập mật khẩu RDS vào đây

        System.out.println("Dang ket noi den AWS RDS...");

        try (Connection connection = DriverManager.getConnection(url, user, password)) {
            // Nếu chạy đến dòng này nghĩa là thành công
            System.out.println("✅ KẾT NỐI THÀNH CÔNG! Database đang hoạt động tốt.");
            System.out.println("Catalog: " + connection.getCatalog());
        } catch (SQLException e) {
            // Nếu nhảy vào đây là thất bại
            System.err.println("❌ KẾT NỐI THẤT BẠI!");
            System.err.println("Lỗi: " + e.getMessage());
        }
    }
}