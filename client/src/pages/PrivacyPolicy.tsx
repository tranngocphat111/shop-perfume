import { useEffect } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";

export const PrivacyPolicy = () => {
  usePageTitle({
    title: "Chính sách bảo mật - SPTN Perfume",
    description:
      "Chính sách bảo mật thông tin cá nhân và quyền riêng tư của khách hàng tại SPTN Perfume.",
    image:
      "https://res.cloudinary.com/piin/image/upload/v1762171215/banner.zip-2_gdvc0y.jpg",
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition mb-4"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Quay về trang chủ
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Chính sách bảo mật
          </h1>
          <p className="text-gray-600">
            Cập nhật lần cuối: {new Date().toLocaleDateString("vi-VN")}
          </p>
        </div>

        <div className="prose max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Thu thập thông tin
            </h2>
            <p className="text-gray-700 mb-4">
              Chúng tôi thu thập thông tin cá nhân của bạn khi bạn:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Đăng ký tài khoản trên website</li>
              <li>Đặt hàng sản phẩm</li>
              <li>Liên hệ với chúng tôi qua email hoặc form liên hệ</li>
              <li>Đăng nhập bằng Google OAuth</li>
            </ul>
            <p className="text-gray-700">
              Thông tin thu thập bao gồm: tên, email, địa chỉ, số điện thoại, và
              thông tin thanh toán (nếu có).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Sử dụng thông tin
            </h2>
            <p className="text-gray-700 mb-4">
              Chúng tôi sử dụng thông tin của bạn để:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Xử lý đơn hàng và giao hàng</li>
              <li>Gửi thông báo về đơn hàng</li>
              <li>Cải thiện dịch vụ và trải nghiệm người dùng</li>
              <li>Gửi email marketing (nếu bạn đồng ý)</li>
              <li>Xác thực danh tính khi đăng nhập</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. Bảo mật thông tin
            </h2>
            <p className="text-gray-700">
              Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn bằng các biện
              pháp bảo mật tiên tiến. Thông tin được mã hóa và lưu trữ an toàn
              trên hệ thống của chúng tôi.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. Chia sẻ thông tin
            </h2>
            <p className="text-gray-700">
              Chúng tôi không bán, cho thuê hoặc chia sẻ thông tin cá nhân của
              bạn cho bên thứ ba, trừ khi:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mt-4">
              <li>Bạn đã đồng ý</li>
              <li>
                Cần thiết để hoàn thành đơn hàng (ví dụ: đối tác vận chuyển)
              </li>
              <li>Yêu cầu bởi pháp luật</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Quyền của bạn
            </h2>
            <p className="text-gray-700 mb-4">Bạn có quyền:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Truy cập và chỉnh sửa thông tin cá nhân</li>
              <li>Yêu cầu xóa tài khoản</li>
              <li>Từ chối nhận email marketing</li>
              <li>Khiếu nại về việc xử lý dữ liệu</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. Cookie và công nghệ theo dõi
            </h2>
            <p className="text-gray-700">
              Chúng tôi sử dụng cookie để cải thiện trải nghiệm người dùng và
              phân tích lưu lượng truy cập. Bạn có thể tắt cookie trong cài đặt
              trình duyệt.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. Liên hệ
            </h2>
            <p className="text-gray-700">
              Nếu bạn có câu hỏi về chính sách bảo mật này, vui lòng liên hệ với
              chúng tôi qua email:{" "}
              <a
                href="mailto:support@shop-perfume.com"
                className="text-blue-600 hover:underline"
              >
                support@shop-perfume.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
