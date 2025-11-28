import { useState } from 'react';
import { Gift, Coins, ChevronDown } from 'lucide-react';
import { type Coupon } from '../../services/coupon.service';
import { type UserInfo } from '../../services/user.service';
import CouponCard from './CouponCard';

interface CouponSectionProps {
  coupons: Coupon[];
  selectedCouponId: number | null;
  userInfo: UserInfo | null;
  isLoading: boolean;
  onSelectCoupon: (couponId: number | null) => void;
}

export default function CouponSection({
  coupons,
  selectedCouponId,
  userInfo,
  isLoading,
  onSelectCoupon
}: CouponSectionProps) {
  const [showAllCoupons, setShowAllCoupons] = useState(false);

  // Đếm số coupon khả dụng (có thể dùng)
  const usableCoupons = coupons.filter(c => {
    if (!userInfo) return false;
    return userInfo.loyaltyPoints >= c.requiredPoints;
  });
  
  // Hiển thị tất cả coupon, nhưng ưu tiên hiển thị 5 coupon khả dụng đầu tiên
  // Sắp xếp: coupon khả dụng lên đầu, sau đó là coupon không khả dụng
  const sortedCoupons = [...coupons].sort((a, b) => {
    const aCanUse = userInfo ? userInfo.loyaltyPoints >= a.requiredPoints : false;
    const bCanUse = userInfo ? userInfo.loyaltyPoints >= b.requiredPoints : false;
    if (aCanUse && !bCanUse) return -1;
    if (!aCanUse && bCanUse) return 1;
    return 0;
  });
  
  // Chỉ hiển thị 5 coupon đầu tiên (ưu tiên các coupon khả dụng)
  const displayedCoupons = showAllCoupons ? sortedCoupons : sortedCoupons.slice(0, 5);
  const hasMoreCoupons = sortedCoupons.length > 5;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Gift className="text-red-500" size={24} />
          Thêm ưu đãi
        </h2>
        <div className="flex items-center gap-3">
          {userInfo ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-300 rounded-lg shadow-sm">
              <Coins size={18} className="text-amber-600" />
              <span className="text-base font-bold text-amber-800">{userInfo.loyaltyPoints.toLocaleString('vi-VN')}</span>
              <span className="text-sm text-amber-700 font-medium">điểm</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg">
              <Coins size={18} className="text-gray-400" />
              <span className="text-sm text-gray-500">Đang tải...</span>
            </div>
          )}
          <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2.5 py-1.5 rounded-md">
            {isLoading ? 'Đang tải...' : `${usableCoupons.length} mã khả dụng`}
          </span>
        </div>
      </div>
      

      {/* GRID LAYOUT CHO COUPON */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Option: Không dùng mã */}
        <div 
          onClick={() => onSelectCoupon(null)}
          className={`
            cursor-pointer rounded-xl border-2 border-dashed flex items-center justify-center gap-3 transition-all min-h-[120px] hover:bg-gray-50
            ${!selectedCouponId ? 'border-black bg-gray-50 text-black' : 'border-gray-200 text-gray-400'}
          `}
        >
          <span className="font-medium text-base">Không áp dụng ưu đãi</span>
        </div>

        {displayedCoupons.map((coupon) => {
          const canUse = userInfo ? userInfo.loyaltyPoints >= coupon.requiredPoints : false;
          return (
            <CouponCard 
              key={coupon.couponId} 
              data={coupon} 
              isSelected={selectedCouponId === coupon.couponId}
              isValid={canUse}
              userPoints={userInfo?.loyaltyPoints || 0}
              onSelect={() => {
                // Chỉ cho phép chọn nếu đủ điểm
                if (canUse) {
                  onSelectCoupon(coupon.couponId);
                }
              }}
            />
          );
        })}
      </div>
      
      {/* Nút Xem thêm / Thu gọn */}
      {hasMoreCoupons && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setShowAllCoupons(!showAllCoupons)}
            className="px-6 py-2.5 text-base font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
          >
            {showAllCoupons ? (
              <>
                <ChevronDown size={16} className="rotate-180" />
                Thu gọn
              </>
            ) : (
              <>
                Xem thêm ({sortedCoupons.length - 5} mã khác)
                <ChevronDown size={16} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

