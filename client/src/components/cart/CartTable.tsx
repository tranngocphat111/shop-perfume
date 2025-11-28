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
    <div className="space-y-4 mb-6">
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
  );
};
