import React, { useState, useEffect } from 'react';
import type { CheckoutFormData, Province, District, Ward, ProvinceDetail, DistrictDetail } from '../../types';

interface ShippingFormProps {
  formData: CheckoutFormData;
  onUpdate: (data: Partial<CheckoutFormData>) => void;
  validationErrors?: Record<string, string>;
}

const PROVINCES_API = 'https://provinces.open-api.vn/api/p/';
const DISTRICTS_API = 'https://provinces.open-api.vn/api/d/';

export const ShippingForm: React.FC<ShippingFormProps> = ({ formData, onUpdate, validationErrors = {} }) => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState({
    provinces: true,
    districts: false,
    wards: false,
  });

  // Load provinces on mount
  useEffect(() => {
    loadProvinces();
  }, []);

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

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const selected = provinces.find(p => p.code.toString() === code);
    
    if (selected) {
      onUpdate({
        cityCode: code,
        city: selected.name,
        district: '',
        districtCode: '',
        ward: '',
        wardCode: '',
      });
      setDistricts([]);
      setWards([]);
      loadDistricts(code);
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const selected = districts.find(d => d.code.toString() === code);
    
    if (selected) {
      onUpdate({
        districtCode: code,
        district: selected.name,
        ward: '',
        wardCode: '',
      });
      setWards([]);
      loadWards(code);
    }
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const selected = wards.find(w => w.code.toString() === code);
    
    if (selected) {
      onUpdate({
        wardCode: code,
        ward: selected.name,
      });
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm">
      <h2 className="text-xl md:text-2xl font-semibold mb-6 pb-3 border-b-2 border-gray-100">
        Thông tin giao hàng
      </h2>

      <div className="space-y-4">
        {/* Họ và tên & Số điện thoại */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => onUpdate({ fullName: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all ${
                validationErrors.fullName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nhập đầy đủ họ và tên của bạn"
              required
            />
            {validationErrors.fullName && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.fullName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => onUpdate({ phone: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all ${
                validationErrors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nhập số điện thoại"
              required
            />
            {validationErrors.phone && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Địa chỉ email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => onUpdate({ email: e.target.value })}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all ${
              validationErrors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Nhập Email"
            required
          />
          {validationErrors.email && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
          )}
        </div>

        {/* Tỉnh/Thành phố & Quận/Huyện */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tỉnh/Thành phố <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.cityCode}
              onChange={handleProvinceChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all bg-white appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                paddingRight: '2.5rem'
              }}
              disabled={loading.provinces}
              required
            >
              <option value="">
                {loading.provinces ? 'Đang tải...' : 'Chọn tỉnh/thành phố'}
              </option>
              {provinces.map(province => (
                <option key={province.code} value={province.code}>
                  {province.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quận/Huyện <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.districtCode}
              onChange={handleDistrictChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all bg-white appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                paddingRight: '2.5rem'
              }}
              disabled={!formData.cityCode || loading.districts}
              required
            >
              <option value="">
                {loading.districts ? 'Đang tải...' : 'Chọn quận/huyện'}
              </option>
              {districts.map(district => (
                <option key={district.code} value={district.code}>
                  {district.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Xã/Phường & Địa chỉ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Xã/Phường/Thị trấn <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.wardCode}
              onChange={handleWardChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all bg-white appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                paddingRight: '2.5rem'
              }}
              disabled={!formData.districtCode || loading.wards}
              required
            >
              <option value="">
                {loading.wards ? 'Đang tải...' : 'Chọn xã/phường/thị trấn'}
              </option>
              {wards.map(ward => (
                <option key={ward.code} value={ward.code}>
                  {ward.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Địa chỉ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => onUpdate({ address: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all ${
                validationErrors.address ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ví dụ: Số 18 Ngõ 86 Phú Kiều"
              required
            />
            {validationErrors.address && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.address}</p>
            )}
          </div>
        </div>

        {/* Ghi chú */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ghi chú đơn hàng (nếu có):
          </label>
          <textarea
            value={formData.note || ''}
            onChange={(e) => onUpdate({ note: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all resize-y min-h-[100px]"
            placeholder="Ghi chú..."
          />
        </div>
      </div>
    </div>
  );
};

