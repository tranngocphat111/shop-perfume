import type { CartItem } from '../../types';
import { CartItem as CartItemComponent } from './CartItem';

interface CartTableProps {
  items: CartItem[];
  onQuantityChange: (productId: number, newQuantity: number) => void;
  onRemove: (productId: number) => void;
}

export const CartTable = ({ 
  items, 
  onQuantityChange, 
  onRemove
}: CartTableProps) => {

  return (
    <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.2)] mb-6 overflow-hidden">
      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="border-b-2 border-gray-200">
            <tr>
              <th className="text-left py-4 px-4 font-medium text-base text-gray-600 w-[40%]">
                Tên sản phẩm
              </th>
              <th className="text-center py-4 px-4 font-medium text-base text-gray-600 w-[20%]">
                Đơn giá
              </th>
              <th className="text-center py-4 px-4 font-medium text-base text-gray-600 w-[15%]">
                Số lượng
              </th>
              <th className="text-right py-4 px-4 font-medium text-base text-gray-600 w-[20%]">
                Thành tiền
              </th>
              <th className="text-center py-4 px-4 font-medium text-base text-gray-600 w-[5%]"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <CartItemComponent
                key={item.product.productId}
                item={item}
                index={index}
                onQuantityChange={onQuantityChange}
                onRemove={onRemove}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View - Hidden on desktop */}
      <div className="block md:hidden">
        {items.map((item, index) => (
          <CartItemComponent
            key={item.product.productId}
            item={item}
            index={index}
            onQuantityChange={onQuantityChange}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
};
