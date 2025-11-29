import { motion } from "framer-motion";
import { MapPin, Phone, Edit2, Star, Trash2, Check } from "lucide-react";
import { type Address } from "../../services/address.service";

interface AddressListProps {
  addresses: Address[];
  onEdit: (address: Address) => void;
  onDelete: (id: number) => void;
  onSetDefault: (id: number) => void;
}

export const AddressList = ({ 
  addresses, 
  onEdit, 
  onDelete, 
  onSetDefault 
}: AddressListProps) => {
  if (addresses.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <MapPin className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-sm">Chưa có địa chỉ nào</p>
        <p className="text-gray-400 text-xs mt-1">Thêm địa chỉ để bắt đầu</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {addresses.map((address, index) => (
        <motion.div
          key={address.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
        >
          {/* Header with name and default badge */}
          <div className="px-3 pt-3 pb-2.5 sm:px-4 sm:pt-4 sm:pb-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h4 className="text-sm sm:text-base font-semibold text-gray-900">{address.recipientName}</h4>
                {address.isDefault && (
                  <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 bg-green-50 border border-green-200 rounded-full">
                    <Check size={9} className="sm:w-[10px] sm:h-[10px] text-green-600" />
                    <span className="text-[10px] sm:text-xs font-medium text-green-700">Mặc định</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Address Details */}
          <div className="px-3 py-2.5 sm:px-4 sm:py-3 space-y-2 sm:space-y-2.5">
            <div className="flex items-center gap-2 sm:gap-2.5 text-xs sm:text-sm text-gray-600">
              <Phone size={12} className="sm:w-[14px] sm:h-[14px] text-gray-400 flex-shrink-0" />
              <span className="leading-none">{address.phone}</span>
            </div>
            <div className="flex items-start gap-2 sm:gap-2.5 text-xs sm:text-sm text-gray-700">
              <MapPin size={12} className="sm:w-[14px] sm:h-[14px] text-gray-400 flex-shrink-0 mt-[6px] sm:mt-[8px]" />
              <p className="text-sm sm:text-base break-words flex-1 leading-relaxed">
                {address.addressLine}, {address.ward}, {address.district}, {address.city}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-3 py-2.5 sm:px-4 sm:py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => onEdit(address)}
              className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-3 sm:py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <Edit2 size={12} className="sm:w-[13px] sm:h-[13px]" />
              <span className="hidden sm:inline">Sửa</span>
            </button>
            {!address.isDefault && (
              <button
                onClick={() => onSetDefault(address.id)}
                className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-3 sm:py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-colors"
              >
                <Star size={12} className="sm:w-[13px] sm:h-[13px]" />
                <span className="hidden sm:inline">Mặc định</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onDelete(address.id)}
              className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-3 sm:py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-md hover:bg-red-50 hover:border-red-300 transition-colors ml-auto"
            >
              <Trash2 size={12} className="sm:w-[13px] sm:h-[13px]" />
              <span className="hidden sm:inline">Xóa</span>
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

