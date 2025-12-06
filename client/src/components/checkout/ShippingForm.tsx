import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Building2, Map } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AddressSelector } from './AddressSelector';
import { type Address } from '../../services/address.service';
import type { CheckoutFormData, Province, District, Ward, ProvinceDetail, DistrictDetail } from '../../types';
import { CustomSelect } from '../profile/CustomSelect';

interface ShippingFormProps {
  formData: CheckoutFormData;
  onUpdate: (data: Partial<CheckoutFormData>) => void;
  validationErrors?: Record<string, string>;
}

const PROVINCES_API = 'https://provinces.open-api.vn/api/p/';
const DISTRICTS_API = 'https://provinces.open-api.vn/api/d/';

export const ShippingForm: React.FC<ShippingFormProps> = ({ formData, onUpdate, validationErrors = {} }) => {
  const { isAuthenticated } = useAuth();
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

  const handleProvinceChange = async (code: string) => {
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
      await loadDistricts(code);
    }
  };

  const handleDistrictChange = async (code: string) => {
    const selected = districts.find(d => d.code.toString() === code);
    
    if (selected) {
      onUpdate({
        districtCode: code,
        district: selected.name,
        ward: '',
        wardCode: '',
      });
      setWards([]);
      await loadWards(code);
    }
  };

  const handleWardChange = (code: string) => {
    const selected = wards.find(w => w.code.toString() === code);
    
    if (selected) {
      onUpdate({
        wardCode: code,
        ward: selected.name,
      });
    }
  };

  // Normalize name for better matching
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

  // Handle address selection from AddressSelector
  const handleSelectAddress = (address: Address, loadedProvinces: Province[], loadedDistricts: District[], loadedWards: Ward[]) => {
    console.log('[ShippingForm] Handling address selection:', address);
    console.log('[ShippingForm] Loaded provinces:', loadedProvinces.length);
    console.log('[ShippingForm] Loaded districts:', loadedDistricts.length);
    console.log('[ShippingForm] Loaded wards:', loadedWards.length);

    // Update provinces, districts, wards
    setProvinces(loadedProvinces);
    setDistricts(loadedDistricts);
    setWards(loadedWards);

    // Normalize names for matching
    const normalizedCity = normalizeName(address.city);
    const normalizedDistrict = normalizeName(address.district);
    const normalizedWard = normalizeName(address.ward || '');

    // Find matching codes (try multiple strategies)
    let province = loadedProvinces.find(p => {
      const normalizedP = normalizeName(p.name);
      return normalizedP === normalizedCity || 
             p.name === address.city ||
             p.name.includes(address.city) || 
             address.city.includes(p.name) ||
             normalizedP.includes(normalizedCity) ||
             normalizedCity.includes(normalizedP);
    });

    let district: District | undefined;
    if (province && address.district) {
      district = loadedDistricts.find(d => {
        const normalizedD = normalizeName(d.name);
        return normalizedD === normalizedDistrict ||
               d.name === address.district ||
               d.name.includes(address.district) || 
               address.district.includes(d.name) ||
               normalizedD.includes(normalizedDistrict) ||
               normalizedDistrict.includes(normalizedD);
      });
    }

    let ward: Ward | undefined;
    if (district && address.ward) {
      ward = loadedWards.find(w => {
        const normalizedW = normalizeName(w.name);
        return normalizedW === normalizedWard ||
               w.name === address.ward ||
               w.name.includes(address.ward) || 
               address.ward.includes(w.name) ||
               normalizedW.includes(normalizedWard) ||
               normalizedWard.includes(normalizedW);
      });
    }

    console.log('[ShippingForm] Matched province:', province?.name, 'code:', province?.code);
    console.log('[ShippingForm] Matched district:', district?.name, 'code:', district?.code);
    console.log('[ShippingForm] Matched ward:', ward?.name, 'code:', ward?.code);

    // Update form data - always fill all fields from address
    onUpdate({
      fullName: address.recipientName || '',
      phone: address.phone || '',
      city: province?.name || address.city || '',
      cityCode: province?.code.toString() || '',
      district: district?.name || address.district || '',
      districtCode: district?.code.toString() || '',
      ward: ward?.name || address.ward || '',
      wardCode: ward?.code.toString() || '',
      address: address.addressLine || '',
    });

    console.log('[ShippingForm] Form updated with address data');
  };

  // Wrapper functions for AddressSelector
  const loadProvincesForSelector = async (): Promise<Province[]> => {
    if (provinces.length > 0) return provinces;
    const response = await fetch(PROVINCES_API);
    const data: Province[] = await response.json();
    setProvinces(data);
    return data;
  };

  const loadDistrictsForSelector = async (provinceCode: string): Promise<District[]> => {
    const response = await fetch(`${PROVINCES_API}${provinceCode}?depth=2`);
    const data: ProvinceDetail = await response.json();
    const loadedDistricts = data.districts || [];
    setDistricts(loadedDistricts);
    return loadedDistricts;
  };

  const loadWardsForSelector = async (districtCode: string): Promise<Ward[]> => {
    const response = await fetch(`${DISTRICTS_API}${districtCode}?depth=2`);
    const data: DistrictDetail = await response.json();
    const loadedWards = data.wards || [];
    setWards(loadedWards);
    return loadedWards;
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm">
      <h2 className="text-xl md:text-2xl font-semibold mb-6 pb-3 border-b-2 border-gray-100">
        Thông tin giao hàng
      </h2>

      {/* Address Selector - only show if user is authenticated */}
      {isAuthenticated && (
        <AddressSelector
          onSelectAddress={handleSelectAddress}
          onLoadProvinces={loadProvincesForSelector}
          onLoadDistricts={loadDistrictsForSelector}
          onLoadWards={loadWardsForSelector}
        />
      )}

      <div className="space-y-4">
        {/* Họ và tên & Số điện thoại */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <User size={16} />
              </div>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => {
                  const value = e.target.value;
                  onUpdate({ fullName: value });
                }}
                onBlur={(e) => {
                  const value = e.target.value.trim();
                  if (value && (value.length < 2 || value.length > 100)) {
                    // Error will be shown from backend validation
                  } else if (value && !/^[\p{L}\s]+$/u.test(value)) {
                    // Error will be shown from backend validation
                  }
                }}
                className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all outline-none ${
                  validationErrors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-200'
                }`}
                placeholder="Nhập đầy đủ họ và tên"
                required
              />
            </div>
            {validationErrors.fullName && (
              <p className="mt-1 text-xs text-red-600 font-medium">
                {validationErrors.fullName}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Phone size={16} />
              </div>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  const value = e.target.value;
                  onUpdate({ phone: value });
                }}
                className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all outline-none ${
                  validationErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-200'
                }`}
                placeholder="Nhập số điện thoại"
                required
              />
            </div>
            {validationErrors.phone && (
              <p className="mt-1 text-xs text-red-600 font-medium">
                {validationErrors.phone}
              </p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-700">
            Địa chỉ email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Mail size={16} />
            </div>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => onUpdate({ email: e.target.value })}
              className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all outline-none ${
                validationErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-200'
              }`}
              placeholder="Nhập địa chỉ email"
              required
            />
          </div>
          {validationErrors.email && (
            <p className="mt-1 text-xs text-red-600 font-medium">
              {validationErrors.email}
            </p>
          )}
        </div>

        {/* Tỉnh/Thành phố & Quận/Huyện */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              Tỉnh/Thành phố <span className="text-red-500">*</span>
            </label>
            <CustomSelect
              value={formData.cityCode}
              onChange={handleProvinceChange}
              options={provinces}
              placeholder="Chọn tỉnh/thành phố"
              icon={<Building2 size={16} />}
              disabled={loading.provinces}
              loading={loading.provinces}
            />
            {validationErrors.city && (
              <p className="mt-1 text-xs text-red-600 font-medium">
                {validationErrors.city}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              Quận/Huyện <span className="text-red-500">*</span>
            </label>
            <CustomSelect
              value={formData.districtCode}
              onChange={handleDistrictChange}
              options={districts}
              placeholder="Chọn quận/huyện"
              icon={<Map size={16} />}
              disabled={!formData.cityCode || loading.districts}
              loading={loading.districts}
            />
            {validationErrors.district && (
              <p className="mt-1 text-xs text-red-600 font-medium">
                {validationErrors.district}
              </p>
            )}
          </div>
        </div>

        {/* Xã/Phường & Địa chỉ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              Xã/Phường/Thị trấn <span className="text-red-500">*</span>
            </label>
            <CustomSelect
              value={formData.wardCode}
              onChange={handleWardChange}
              options={wards}
              placeholder="Chọn xã/phường/thị trấn"
              icon={<MapPin size={16} />}
              disabled={!formData.districtCode || loading.wards}
              loading={loading.wards}
            />
            {validationErrors.ward && (
              <p className="mt-1 text-xs text-red-600 font-medium">
                {validationErrors.ward}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              Địa chỉ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <MapPin size={16} />
              </div>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => onUpdate({ address: e.target.value })}
                className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all outline-none ${
                  validationErrors.address ? 'border-red-500 bg-red-50' : 'border-gray-200'
                }`}
                placeholder="Số nhà, tên đường..."
                required
              />
            </div>
            {validationErrors.address && (
              <p className="mt-1 text-xs text-red-600 font-medium">
                {validationErrors.address}
              </p>
            )}
          </div>
        </div>

        {/* Ghi chú */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-700">
            Ghi chú đơn hàng (nếu có)
          </label>
          <textarea
            value={formData.note || ''}
            onChange={(e) => onUpdate({ note: e.target.value })}
            className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all outline-none resize-y min-h-[100px] ${
              validationErrors.note ? 'border-red-500 bg-red-50' : 'border-gray-200'
            }`}
            placeholder="Ghi chú..."
          />
          {validationErrors.note && (
            <p className="mt-1 text-xs text-red-600 font-medium">
              {validationErrors.note}
            </p>
          )}
        </div>

        {/* General Error (if any) */}
        {validationErrors._general && (
          <div className="p-3 bg-red-50 border border-red-500 rounded-lg">
            <p className="text-sm text-red-600 font-medium">
              {validationErrors._general}
            </p>
          </div>
        )}

        {/* Cart Items Errors (if any) */}
        {validationErrors._cartItemsArray && (
          <div className="p-3 bg-red-50 border border-red-500 rounded-lg">
            <p className="text-sm font-semibold text-red-700 mb-2">Lỗi sản phẩm:</p>
            <ul className="list-disc list-inside space-y-1">
              {JSON.parse(validationErrors._cartItemsArray).map((error: string, index: number) => (
                <li key={index} className="text-sm text-red-600">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

