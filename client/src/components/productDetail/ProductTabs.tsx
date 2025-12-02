import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Info, Shield, Star } from "lucide-react";
import type { Product } from "../../types";
import { ProductReviews } from "./ProductReviews";
import { reviewService } from "../../services/review.service";

interface ParsedNotes {
  top?: string[];
  middle?: string[];
  base?: string[];
}

interface ProductTabsProps {
  product: Product;
}

const parseNotes = (description: string): ParsedNotes => {
  const notes: ParsedNotes = {};
  const lines = description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length >= 3) {
    const last3Lines = lines.slice(-3);
    const hasTopNote = last3Lines.some((line) =>
      line.match(/^Hương đầu[:\s]/i)
    );
    const hasMiddleNote = last3Lines.some((line) =>
      line.match(/^Hương giữa[:\s]/i)
    );
    const hasBaseNote = last3Lines.some((line) =>
      line.match(/^Hương cuối[:\s]/i)
    );

    if (hasTopNote || hasMiddleNote || hasBaseNote) {
      last3Lines.forEach((line) => {
        const topMatch = line.match(/^Hương đầu[:\s]+(.+)$/i);
        const middleMatch = line.match(/^Hương giữa[:\s]+(.+)$/i);
        const baseMatch = line.match(/^Hương cuối[:\s]+(.+)$/i);

        if (topMatch) {
          const content = topMatch[1].trim();
          notes.top = content
            .split(/[,，]/)
            .map((n) => n.trim())
            .filter((n) => n.length > 0);
        }

        if (middleMatch) {
          const content = middleMatch[1].trim();
          notes.middle = content
            .split(/[,，]/)
            .map((n) => n.trim())
            .filter((n) => n.length > 0);
        }

        if (baseMatch) {
          const content = baseMatch[1].trim();
          notes.base = content
            .split(/[,，]/)
            .map((n) => n.trim())
            .filter((n) => n.length > 0);
        }
      });
    }
  }

  return notes;
};

const formatDescription = (description: string): string[] => {
  const lines = description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length >= 3) {
    const last3Lines = lines.slice(-3);
    const hasTopNote = last3Lines.some((line) =>
      line.match(/^Hương đầu[:\s]/i)
    );
    const hasMiddleNote = last3Lines.some((line) =>
      line.match(/^Hương giữa[:\s]/i)
    );
    const hasBaseNote = last3Lines.some((line) =>
      line.match(/^Hương cuối[:\s]/i)
    );

    if (hasTopNote || hasMiddleNote || hasBaseNote) {
      return lines.slice(0, -3);
    }
  }

  return lines;
};

export const ProductTabs = ({ product }: ProductTabsProps) => {
  const [activeTab, setActiveTab] = useState<
    "description" | "usage" | "policy" | "reviews"
  >("description");
  const [hasReviews, setHasReviews] = useState(false);
  const notes = parseNotes(product.description);
  const descriptionLines = formatDescription(product.description);

  useEffect(() => {
    const checkReviews = async () => {
      try {
        const reviews = await reviewService.getReviewsByProduct(
          product.productId
        );
        setHasReviews(reviews.length > 0);
      } catch (error) {
        console.error("Failed to check reviews:", error);
        setHasReviews(false);
      }
    };
    checkReviews();
  }, [product.productId]);

  return (
    <div>
      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex gap-8 -mb-px">
          <button
            onClick={() => setActiveTab("description")}
            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-lg transition-colors ${
              activeTab === "description"
                ? "border-black text-black"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FileText className="w-6 h-6" />
            <span>Mô tả sản phẩm</span>
          </button>
          <button
            onClick={() => setActiveTab("usage")}
            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-lg transition-colors ${
              activeTab === "usage"
                ? "border-black text-black"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Info className="w-6 h-6" />
            <span>Sử dụng và bảo quản</span>
          </button>
          <button
            onClick={() => setActiveTab("policy")}
            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-lg transition-colors ${
              activeTab === "policy"
                ? "border-black text-black"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Shield className="w-6 h-6" />
            <span>Chính sách</span>
          </button>
          {hasReviews && (
            <button
              onClick={() => setActiveTab("reviews")}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-lg transition-colors ${
                activeTab === "reviews"
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Star className="w-6 h-6" />
              <span>Đánh giá</span>
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {/* Description Tab */}
        {activeTab === "description" && (
          <div className="space-y-6">
            <div className="text-gray-700">
              {descriptionLines.length > 0 ? (
                descriptionLines
                  .filter((line) => {
                    const isNoteHeader = line.match(
                      /^Hương (đầu|giữa|cuối)[:\s]/i
                    );
                    if (isNoteHeader && line.length < 50) {
                      return false;
                    }
                    return true;
                  })
                  .map((line, index) => (
                    <p
                      key={index}
                      className="text-base leading-relaxed mb-4 text-gray-700"
                    >
                      {line}
                    </p>
                  ))
              ) : (
                <p className="text-base text-gray-600 italic">
                  Chưa có mô tả cho sản phẩm này.
                </p>
              )}
            </div>

            {/* Fragrance Notes */}
            {(notes.top || notes.middle || notes.base) && (
              <div className="pt-6">
                <h3 className="text-xl font-semibold text-black mb-4">
                  Thông tin hương thơm
                </h3>
                <ul className="space-y-3 text-gray-700 list-none">
                  {notes.top && notes.top.length > 0 && (
                    <li className="flex items-start">
                      <span className="text-black mr-3 mt-0.5 flex-shrink-0">
                        •
                      </span>
                      <span className="text-base leading-relaxed flex-1">
                        <span className="font-normal text-gray-800">
                          Hương đầu:
                        </span>{" "}
                        {notes.top.join(", ")}
                      </span>
                    </li>
                  )}
                  {notes.middle && notes.middle.length > 0 && (
                    <li className="flex items-start">
                      <span className="text-black mr-3 mt-0.5 flex-shrink-0">
                        •
                      </span>
                      <span className="text-base leading-relaxed flex-1">
                        <span className="font-normal text-gray-800">
                          Hương giữa:
                        </span>{" "}
                        {notes.middle.join(", ")}
                      </span>
                    </li>
                  )}
                  {notes.base && notes.base.length > 0 && (
                    <li className="flex items-start">
                      <span className="text-black mr-3 mt-0.5 flex-shrink-0">
                        •
                      </span>
                      <span className="text-base leading-relaxed flex-1">
                        <span className="font-normal text-gray-800">
                          Hương cuối:
                        </span>{" "}
                        {notes.base.join(", ")}
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Usage and Storage Tab */}
        {activeTab === "usage" && (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-black mb-4">
                Hướng Dẫn Sử Dụng
              </h3>
              <ul className="space-y-3 text-gray-700 list-none">
                <li className="flex items-start">
                  <span className="text-black mr-3 mt-0.5 flex-shrink-0">
                    •
                  </span>
                  <span className="text-base leading-relaxed flex-1">
                    Ưu tiên xịt nước hoa vào các vị trí như cổ tay, khuỷu tay,
                    sau tai, gáy và cổ trước.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-black mr-3 mt-0.5 flex-shrink-0">
                    •
                  </span>
                  <span className="text-base leading-relaxed flex-1">
                    Sau khi xịt nước hoa, tránh việc chà xát hoặc làm khô da
                    bằng bất kỳ vật dụng nào khác. Điều này có thể làm phá vỡ
                    các tầng hương của nước hoa, dẫn đến sự thay đổi mùi hương
                    hoặc làm nước hoa bay mùi nhanh hơn.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-black mr-3 mt-0.5 flex-shrink-0">
                    •
                  </span>
                  <span className="text-base leading-relaxed flex-1">
                    Xịt nước hoa từ khoảng cách 15-20 cm với một lực xịt mạnh và
                    dứt khoát để đảm bảo nước hoa phủ đều, tăng cường độ bám tỏa
                    trên da.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-black mr-3 mt-0.5 flex-shrink-0">
                    •
                  </span>
                  <span className="text-base leading-relaxed flex-1">
                    Hiệu quả của nước hoa có thể thay đổi tùy thuộc vào thời
                    gian, không gian, cơ địa và thói quen sinh hoạt, chế độ ăn
                    uống của bạn.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-black mr-3 mt-0.5 flex-shrink-0">
                    •
                  </span>
                  <span className="text-base leading-relaxed flex-1">
                    Nên mang theo nước hoa bên mình hoặc sử dụng các mẫu nhỏ
                    tiện lợi để dễ dàng bổ sung khi cần.
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-black mb-4">
                Bảo Quản Nước Hoa
              </h3>
              <ul className="space-y-3 text-gray-700 list-none">
                <li className="flex items-start">
                  <span className="text-black mr-3 mt-0.5 flex-shrink-0">
                    •
                  </span>
                  <span className="text-base leading-relaxed flex-1">
                    Nước hoa thường không có hạn sử dụng cụ thể, tuy nhiên, một
                    số loại có thể có hạn sử dụng từ 24 đến 36 tháng kể từ ngày
                    mở nắp và sử dụng lần đầu.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-black mr-3 mt-0.5 flex-shrink-0">
                    •
                  </span>
                  <span className="text-base leading-relaxed flex-1">
                    Bảo quản nước hoa ở nơi khô ráo, thoáng mát, tránh ánh nắng
                    mặt trời, nhiệt độ cao hoặc quá lạnh. Tránh để nước hoa
                    trong cốp xe hoặc các khu vực có nhiệt độ thay đổi thất
                    thường.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Policy Tab */}
        {activeTab === "policy" && (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-black mb-4">
                Chính sách bảo hành
              </h3>
              <p className="text-base text-gray-700 leading-relaxed mb-4">
                LAN Perfume sẽ hỗ trợ khách hàng đổi sản phẩm trong vòng 03 ngày
                kể từ ngày mua tại cửa hàng hoặc 03 ngày kể từ ngày nhận hàng
                online (Quý khách vui lòng quay lại video khi nhận hàng).
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-black mb-4">
                Chính sách đổi trả
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    1. ĐIỀU KIỆN ĐỔI HÀNG
                  </h4>
                  <ul className="space-y-2 text-gray-700 list-none">
                    <li className="flex items-start">
                      <span className="text-black mr-3 mt-0.5 flex-shrink-0">
                        •
                      </span>
                      <span className="text-base leading-relaxed flex-1">
                        Sản phẩm khách hàng chưa sử dụng: còn nguyên seal, tem
                        niêm phong của LAN Perfume hoặc hóa đơn mua hàng.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-black mr-3 mt-0.5 flex-shrink-0">
                        •
                      </span>
                      <span className="text-base leading-relaxed flex-1">
                        Sản phẩm bị hư hỏng do lỗi của nhà sản xuất.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-black mr-3 mt-0.5 flex-shrink-0">
                        •
                      </span>
                      <span className="text-base leading-relaxed flex-1">
                        Hư hỏng phần vòi xịt, thân chai nứt, bể trong quá trình
                        vận chuyển.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-black mr-3 mt-0.5 flex-shrink-0">
                        •
                      </span>
                      <span className="text-base leading-relaxed flex-1">
                        Nước hoa bị rò rỉ, giảm dung tích so với thực tế khi vừa
                        nhận hàng.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-black mr-3 mt-0.5 flex-shrink-0">
                        •
                      </span>
                      <span className="text-base leading-relaxed flex-1">
                        Nước hoa bị biến đổi màu hoặc mùi hương khi nhận hàng.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-black mr-3 mt-0.5 flex-shrink-0">
                        •
                      </span>
                      <span className="text-base leading-relaxed flex-1">
                        Giao sai hoặc nhầm lẫn với mùi hương khác so với đơn đặt
                        hàng.
                      </span>
                    </li>
                  </ul>
                  <p className="text-sm text-gray-600 mt-3 font-medium">
                    LƯU Ý: Chỉ nhận đổi hàng khi có video nhận hàng
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    2. QUY TRÌNH ĐỔI HÀNG
                  </h4>
                  <ul className="space-y-2 text-gray-700 list-none">
                    <li className="flex items-start">
                      <span className="text-black mr-3 mt-0.5 flex-shrink-0">
                        •
                      </span>
                      <span className="text-base leading-relaxed flex-1">
                        Đổi với sản phẩm khách hàng chưa sử dụng: Giá trị sản
                        phẩm mới phải tương đương hoặc cao hơn giá trị đổi của
                        sản phẩm cũ (nếu giá cao hơn khách hàng vui lòng thanh
                        toán thêm phần chênh lệch).
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-black mr-3 mt-0.5 flex-shrink-0">
                        •
                      </span>
                      <span className="text-base leading-relaxed flex-1">
                        Đổi với các sản phẩm bị hư hỏng do lỗi của nhà sản xuất:
                        LAN Perfume sẽ hỗ trợ khách đổi sản phẩm, hỗ trợ 100%
                        chi phí phát sinh.
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    3. CÁC TRƯỜNG HỢP KHÔNG HỖ TRỢ ĐỔI
                  </h4>
                  <ul className="space-y-2 text-gray-700 list-none">
                    <li className="flex items-start">
                      <span className="text-black mr-3 mt-0.5 flex-shrink-0">
                        •
                      </span>
                      <span className="text-base leading-relaxed flex-1">
                        Không áp dụng đổi hàng cho các sản phẩm chiết, gốc
                        chiết.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-black mr-3 mt-0.5 flex-shrink-0">
                        •
                      </span>
                      <span className="text-base leading-relaxed flex-1">
                        Các sản phẩm không còn nguyên seal, seal có dấu hiệu bị
                        rách, bẩn.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-black mr-3 mt-0.5 flex-shrink-0">
                        •
                      </span>
                      <span className="text-base leading-relaxed flex-1">
                        Các sản phẩm không có tem niêm phong của LAN Perfume
                        hoặc tem có dấu hiệu bị cậy, rách.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-black mr-3 mt-0.5 flex-shrink-0">
                        •
                      </span>
                      <span className="text-base leading-relaxed flex-1">
                        Các sản phẩm được LAN Perfume tặng kèm khi mua hàng tại
                        cửa hàng hoặc qua hình thức online.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-black mr-3 mt-0.5 flex-shrink-0">
                        •
                      </span>
                      <span className="text-base leading-relaxed flex-1">
                        Các sản phẩm đã quá hạn đổi trả.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <ProductReviews productId={product.productId} />
        )}
      </div>
    </div>
  );
};
