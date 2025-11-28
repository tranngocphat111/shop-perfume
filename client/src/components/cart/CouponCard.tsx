import { motion } from 'framer-motion';
import { TicketPercent, Check, Coins } from 'lucide-react';
import { type Coupon } from '../../services/coupon.service';

interface CouponCardProps {
  data: Coupon;
  isSelected: boolean;
  onSelect: () => void;
  isValid: boolean;
  userPoints: number;
}

export default function CouponCard({ 
  data, 
  isSelected, 
  onSelect,
  isValid,
  userPoints
}: CouponCardProps) {
  // Format end date
  const formatEndDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return '31/12/2025';
    }
  };

  const hasEnoughPoints = userPoints >= data.requiredPoints;

  return (
    <div 
      onClick={isValid && hasEnoughPoints ? onSelect : undefined}
      className={`
        relative group overflow-hidden rounded-xl border-2 transition-all duration-200 flex flex-col justify-between min-h-[120px]
        ${isSelected 
          ? 'border-black bg-gray-50 shadow-sm cursor-pointer' 
          : isValid && hasEnoughPoints
          ? 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-md cursor-pointer'
          : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
        }
      `}
    >
      {/* Decorative Circle (Lỗ bấm vé) */}
      <div className={`absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-r border-inherit bg-gray-50 z-10 box-border ${isSelected ? 'border-black' : 'border-gray-100'}`} />
      <div className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-l border-inherit bg-gray-50 z-10 box-border ${isSelected ? 'border-black' : 'border-gray-100'}`} />

      <div className="p-4 pl-6 flex flex-col h-full justify-between relative z-0">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
             <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-black group-hover:text-white transition-colors'}`}>
               <TicketPercent size={18} />
             </div>
             <span className={`font-bold text-lg ${isSelected ? 'text-black' : 'text-gray-800'}`}>
               {data.code}
             </span>
          </div>
          {isSelected && (
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              className="bg-black text-white rounded-full p-1"
            >
              <Check size={16} />
            </motion.div>
          )}
        </div>
        
        <div className="mt-3">
          <p className="text-base text-gray-600 font-medium">{data.description}</p>
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-sm text-gray-400">HSD: {formatEndDate(data.endDate)}</p>
            <div className="flex items-center gap-1 text-sm">
              <Coins size={14} className={hasEnoughPoints ? 'text-amber-500' : 'text-gray-400'} />
              <span className={hasEnoughPoints ? 'text-amber-600 font-semibold' : 'text-gray-400'}>
                {data.requiredPoints} điểm
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

