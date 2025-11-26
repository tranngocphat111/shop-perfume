import { useAuth } from "@contexts/AuthContext";

export const AccountInfo = () => {
  const { user } = useAuth();
  return (
    <div className="p-6 bg-white rounded-lg border border-gray-100 shadow-sm">
      <p className="text-lg leading-relaxed text-gray-800">
        Chào {user?.name},
        <span className="text-gray-600">
          {" "}
          nếu không phải bạn, hãy đăng xuất và đăng nhập bằng tài khoản đúng.
        </span>
      </p>
      <p className="mt-3 text-lg leading-relaxed text-gray-800">
        Tại trang này, bạn có thể theo dõi đơn hàng gần đây, quản lý sổ địa chỉ,
        thiết lập phương thức thanh toán và cập nhật thông tin cá nhân cùng mật
        khẩu.
      </p>
    </div>
  );
};
