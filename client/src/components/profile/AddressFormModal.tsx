import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Phone, MapPin, Building2, Map, Check } from "lucide-react";
import { type Address } from "../../services/address.service";
import { CustomSelect } from "./CustomSelect";
import type { Province, District, Ward, ProvinceDetail, DistrictDetail } from "../../types";

const PROVINCES_API = 'https://provinces.open-api.vn/api/p/';
const DISTRICTS_API = 'https://provinces.open-api.vn/api/d/';

interface AddressFormModalProps {
  isOpen: boolean;
  editing: Address | null;
  initialForm: Omit<Address, "id">;
  onClose: () => void;
  onSave: (form: Omit<Address, "id">) => Promise<void>;
  userDefaultName?: string;
}

export const AddressFormModal = ({
  isOpen,
  editing,
  initialForm,
  onClose,
  onSave,
  userDefaultName,
}: AddressFormModalProps) => {
  const [form, setForm] = useState<Omit<Address, "id">>(initialForm);
  const [error, setError] = useState("");
  
  // For dropdowns
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState({
    provinces: false,
    districts: false,
    wards: false,
  });

  // Reset form when modal opens/closes or editing changes
  useEffect(() => {
    if (isOpen) {
      setForm(initialForm);
      setError("");
    }
  }, [isOpen, initialForm]);

  // Load provinces when modal opens
  useEffect(() => {
    if (isOpen && provinces.length === 0) {
      loadProvinces();
    }
  }, [isOpen]);

  // Auto-load districts when editing address with city
  useEffect(() => {
    if (isOpen && editing && form.city && provinces.length > 0 && districts.length === 0) {
      const normalizedCity = normalizeName(form.city);
      const province = provinces.find(p => {
        const normalizedP = normalizeName(p.name);
        return normalizedP === normalizedCity ||
               p.name === form.city ||
               p.name.includes(form.city) || 
               form.city.includes(p.name) ||
               normalizedP.includes(normalizedCity) ||
               normalizedCity.includes(normalizedP);
      });
      
      if (province) {
        loadDistricts(province.code.toString());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editing, form.city, provinces.length]);

  // Auto-load wards when editing address with district
  useEffect(() => {
    if (isOpen && editing && form.district && districts.length > 0 && wards.length === 0) {
      const normalizedDistrict = normalizeName(form.district);
      const district = districts.find(d => {
        const normalizedD = normalizeName(d.name);
        return normalizedD === normalizedDistrict ||
               d.name === form.district ||
               d.name.includes(form.district) ||
               form.district.includes(d.name) ||
               normalizedD.includes(normalizedDistrict) ||
               normalizedDistrict.includes(normalizedD);
      });
      
      if (district) {
        loadWards(district.code.toString());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editing, form.district, districts.length]);

  const normalizeName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/^(thành phố|tp\.?|tỉnh|t\.?)\s*/i, '')
      .replace(/\s*(thành phố|tp\.?|tỉnh|t\.?)$/i, '')
      .replace(/^(quận|huyện|q\.?|h\.?)\s*/i, '')
      .replace(/\s*(quận|huyện|q\.?|h\.?)$/i, '')
      .replace(/^(phường|xã|thị trấn|p\.?|x\.?|tt\.?)\s*/i, '')
      .replace(/\s*(phường|xã|thị trấn|p\.?|x\.?|tt\.?)$/i, '')
      .trim();
  };

  const loadProvinces = async () => {
    try {
      setLoading(prev => ({ ...prev, provinces: true }));
      const response = await fetch(PROVINCES_API);
      const data: Province[] = await response.json();
      setProvinces(data);
    } catch (error) {
      console.error('Error loading provinces:', error);
    } finally {
      setLoading(prev => ({ ...prev, provinces: false }));
    }
  };

  const loadDistricts = async (provinceCode: string) => {
    try {
      setLoading(prev => ({ ...prev, districts: true }));
      const response = await fetch(`${PROVINCES_API}${provinceCode}?depth=2`);
      const data: ProvinceDetail = await response.json();
      setDistricts(data.districts || []);
    } catch (error) {
      console.error('Error loading districts:', error);
    } finally {
      setLoading(prev => ({ ...prev, districts: false }));
    }
  };

  const loadWards = async (districtCode: string) => {
    try {
      setLoading(prev => ({ ...prev, wards: true }));
      const response = await fetch(`${DISTRICTS_API}${districtCode}?depth=2`);
      const data: DistrictDetail = await response.json();
      setWards(data.wards || []);
    } catch (error) {
      console.error('Error loading wards:', error);
    } finally {
      setLoading(prev => ({ ...prev, wards: false }));
    }
  };

  const handleSave = async () => {
    if (
      !form.recipientName ||
      !form.phone ||
      !form.addressLine ||
      !form.ward ||
      !form.district ||
      !form.city
    ) {
      setError("Vui lòng điền đầy đủ thông tin địa chỉ");
      return;
    }
    if (!/(^\+84|^0)[0-9]{9,10}$/.test(form.phone)) {
      setError("Số điện thoại không hợp lệ");
      return;
    }

    try {
      await onSave(form);
      onClose();
      setError("");
    } catch (error: any) {
      setError(error.message || "Có lỗi xảy ra khi lưu địa chỉ");
    }
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleClose();
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex items-center justify-between">
              <h4 className="text-base font-bold text-gray-900">
                {editing ? "Sửa địa chỉ" : "Thêm địa chỉ"}
              </h4>
              <button
                type="button"
                onClick={handleClose}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Content */}
            <div className="p-5 space-y-4 overflow-y-auto" style={{ overflowY: 'auto' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Name Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700">
                    Tên người nhận
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <User size={16} />
                    </div>
                    <input
                      className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all outline-none"
                      placeholder="Nhập tên người nhận"
                      value={form.recipientName}
                      onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                    />
                  </div>
                </div>

                {/* Phone Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Phone size={16} />
                    </div>
                    <input
                      className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all outline-none"
                      placeholder="Nhập số điện thoại"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Address Line Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  Địa chỉ
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <MapPin size={16} />
                  </div>
                  <input
                    className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all outline-none"
                    placeholder="Số nhà, tên đường..."
                    value={form.addressLine}
                    onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
                  />
                </div>
              </div>

              {/* Location Dropdowns */}
              <div className="space-y-3">
                {/* Province/City Dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700">
                    Tỉnh/Thành phố <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    value={provinces.find(p => p.name === form.city)?.code.toString() || ''}
                    onChange={async (code) => {
                      const selected = provinces.find(p => p.code.toString() === code);
                      if (selected) {
                        setForm({ ...form, city: selected.name, district: '', ward: '' });
                        setDistricts([]);
                        setWards([]);
                        await loadDistricts(code);
                      }
                    }}
                    options={provinces}
                    placeholder="Chọn tỉnh/thành phố"
                    icon={<Building2 size={16} />}
                    disabled={loading.provinces}
                    loading={loading.provinces}
                  />
                </div>

                {/* District Dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700">
                    Quận/Huyện <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    value={districts.find(d => d.name === form.district)?.code.toString() || ''}
                    onChange={async (code) => {
                      const selected = districts.find(d => d.code.toString() === code);
                      if (selected) {
                        setForm({ ...form, district: selected.name, ward: '' });
                        setWards([]);
                        await loadWards(code);
                      }
                    }}
                    options={districts}
                    placeholder="Chọn quận/huyện"
                    icon={<Map size={16} />}
                    disabled={!form.city || loading.districts}
                    loading={loading.districts}
                  />
                </div>

                {/* Ward Dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700">
                    Xã/Phường/Thị trấn <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    value={wards.find(w => w.name === form.ward)?.code.toString() || ''}
                    onChange={(code) => {
                      const selected = wards.find(w => w.code.toString() === code);
                      if (selected) {
                        setForm({ ...form, ward: selected.name });
                      }
                    }}
                    options={wards}
                    placeholder="Chọn xã/phường/thị trấn"
                    icon={<MapPin size={16} />}
                    disabled={!form.district || loading.wards}
                    loading={loading.wards}
                  />
                </div>
              </div>

              {/* Default Address Checkbox */}
              <div className="flex items-center gap-3 pt-2">
                <label className="relative flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded border-2 transition-all flex items-center justify-center ${
                    form.isDefault 
                      ? 'bg-black border-black' 
                      : 'border-gray-300 group-hover:border-gray-400'
                  }`}>
                    {form.isDefault && (
                      <Check size={12} className="text-white" />
                    )}
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                    Đặt làm địa chỉ mặc định
                  </span>
                </label>
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-6 py-3 bg-red-50 border-t border-red-100"
                >
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer Buttons */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="min-w-24 relative btn-slide-overlay px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
              >
                <span className="relative z-index-10">Hủy</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="min-w-24 relative btn-slide-overlay-dark overflow-hidden px-5 py-2.5 text-sm font-semibold text-white bg-black rounded-full hover:bg-gray-800 transition-colors"
              >
                <span className="relative z-index-10">Lưu</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

