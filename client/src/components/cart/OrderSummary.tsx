import { forwardRef } from 'react';
import { ArrowRight, TicketPercent } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/helpers';
import { type Coupon } from '../../services/coupon.service';

interface OrderSummaryProps {
  total: number;
  discount: number;
  itemCount?: number;
  isAuthenticated: boolean;
  selectedCoupon: Coupon | undefined;
}

const OrderSummary = forwardRef<HTMLDivElement, OrderSummaryProps>(({
  total,
  discount,
  itemCount,
  isAuthenticated,
  selectedCoupon
}, ref) => {
  const navigate = useNavigate();
  const finalTotal = total - discount;

  return (
    <div ref={ref} className="bg-gray-50 border-t border-gray-100 p-6 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6">

        {/* Breakdown bên trái - Tăng width */}
        <div className="w-full md:w-auto md:flex-[1.5] space-y-2">
          {/* Số lượng sản phẩm */}
          {itemCount !== undefined && itemCount > 0 && (
            <div className="flex justify-between md:justify-start md:gap-8 text-gray-500 text-base mb-1">
              <span className="font-medium">Số lượng sản phẩm</span>
              <span className="font-semibold text-gray-700">
                {itemCount} {itemCount === 1 ? 'sản phẩm' : 'sản phẩm'}
              </span>
            </div>
          )}
          <div className="flex justify-between md:justify-start md:gap-8 text-gray-600 text-base md:text-lg">
            <span className="font-medium">Tổng tiền hàng</span>
            <span className="font-semibold text-gray-900">{formatCurrency(total)}</span>
          </div>
          {isAuthenticated && selectedCoupon && discount > 0 && (
            <div className="flex justify-between md:justify-start md:gap-8 text-green-600 text-base md:text-lg">
              <span className="flex items-center gap-1.5 font-medium">
                <TicketPercent size={18} /> {selectedCoupon.code}
              </span>
              <span className="font-bold">-{formatCurrency(discount)}</span>
            </div>
          )}
          <p className="text-sm text-gray-400 italic pt-2 max-w-md">
            * Phí vận chuyển sẽ được tính tại bước thanh toán.
          </p>
        </div>

        {/* Total & Action bên phải - Giảm width */}
        <div className="w-full md:w-auto md:flex-[1] flex flex-col md:items-end gap-3 md:min-w-[200px] md:max-w-[280px]">
          <div className="flex items-baseline justify-between md:justify-end gap-4 w-full">
            <span className="text-gray-500 font-medium text-base md:text-lg">Thành tiền</span>
            <span className="text-1xl md:text-2xl font-extrabold text-black">{formatCurrency(finalTotal)}</span>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="relative btn-slide-overlay-dark overflow-hidden w-full md:w-auto bg-black text-white hover:bg-gray-800 px-4 md:px-8 py-2 md:py-2.5 rounded-full font-bold text-base md:text-lg shadow-lg transition-all flex justify-center items-center gap-2"
          >
            <span className='relative z-1 flex items-center justify-center gap-2'>
              Thanh toán
              <ArrowRight size={18} />
              </span>
          </button>
        </div>
      </div>
    </div>
  );
});

OrderSummary.displayName = 'OrderSummary';

export default OrderSummary;

