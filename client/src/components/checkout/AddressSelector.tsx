import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { addressService, type Address } from '../../services/address.service';
import type { CheckoutFormData, Province, District, Ward, ProvinceDetail, DistrictDetail } from '../../types';
import { FaMapMarkerAlt, FaPlus } from 'react-icons/fa';
import { GoSync } from "react-icons/go";

interface AddressSelectorProps {
  formData: CheckoutFormData;
  onSelectAddress: (address: Address, provinces: Province[], districts: District[], wards: Ward[]) => void;
  onLoadProvinces: () => Promise<Province[]>;
  onLoadDistricts: (provinceCode: string) => Promise<District[]>;
  onLoadWards: (districtCode: string) => Promise<Ward[]>;
}

const PROVINCES_API = 'https://provinces.open-api.vn/api/p/';
const DISTRICTS_API = 'https://provinces.open-api.vn/api/d/';

export const AddressSelector: React.FC<AddressSelectorProps> = ({
  formData,
  onSelectAddress,
  onLoadProvinces,
  onLoadDistricts,
  onLoadWards,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  
  // Form state for adding new address
  const [newAddressForm, setNewAddressForm] = useState({
    recipientName: '',
    phone: '',
    addressLine: '',
    ward: '',
    district: '',
    city: '',
    isDefault: false,
  });
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState({
    provinces: false,
    districts: false,
    wards: false,
    saving: false,
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isAuthenticated && user) {
      loadAddresses();
    }
  }, [isAuthenticated, user]);

  // Load provinces when add form opens
  useEffect(() => {
    if (showAddForm && provinces.length === 0) {
      loadProvincesForForm();
    }
  }, [showAddForm]);

  // Auto-load districts when city is selected
  useEffect(() => {
    if (showAddForm && newAddressForm.city && provinces.length > 0) {
      const province = provinces.find(p => p.name === newAddressForm.city);
      if (province) {
        loadDistrictsForForm(province.code.toString());
      }
    }
  }, [showAddForm, newAddressForm.city, provinces]);

  // Auto-load wards when district is selected
  useEffect(() => {
    if (showAddForm && newAddressForm.district && districts.length > 0) {
      const district = districts.find(d => d.name === newAddressForm.district);
      if (district) {
        loadWardsForForm(district.code.toString());
      }
    }
  }, [showAddForm, newAddressForm.district, districts]);

  const loadAddresses = async () => {
    try {
      const savedAddresses = await addressService.getAddresses();
      setAddresses(savedAddresses);
      
      // Auto-select default address if available
      if (savedAddresses.length > 0) {
        const defaultAddress = savedAddresses.find(a => a.isDefault) || savedAddresses[0];
        if (defaultAddress) {
          handleSelectAddress(defaultAddress);
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  const loadProvincesForForm = async () => {
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

  const loadDistrictsForForm = async (provinceCode: string) => {
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

  const loadWardsForForm = async (districtCode: string) => {
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

  const handleAddAddress = async () => {
    if (!newAddressForm.recipientName || !newAddressForm.phone || !newAddressForm.addressLine || 
        !newAddressForm.city || !newAddressForm.district || !newAddressForm.ward) {
      setFormError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, saving: true }));
      setFormError('');
      
      const newAddress = await addressService.createAddress({
        recipientName: newAddressForm.recipientName,
        phone: newAddressForm.phone,
        addressLine: newAddressForm.addressLine,
        ward: newAddressForm.ward,
        district: newAddressForm.district,
        city: newAddressForm.city,
        isDefault: newAddressForm.isDefault,
      });

      // Reload addresses
      await loadAddresses();
      
      // Auto-select the newly created address
      await handleSelectAddress(newAddress);
      
      // Close form
      setShowAddForm(false);
      setNewAddressForm({
        recipientName: '',
        phone: '',
        addressLine: '',
        ward: '',
        district: '',
        city: '',
        isDefault: false,
      });
      setDistricts([]);
      setWards([]);
    } catch (error: any) {
      console.error('Error creating address:', error);
      setFormError(error.message || 'Không thể tạo địa chỉ mới');
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  // Normalize name for better matching (remove common prefixes/suffixes)
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

  const handleSelectAddress = async (address: Address) => {
    setSelectedAddressId(address.id);
    setIsOpen(false);

    try {
      console.log('[AddressSelector] Selecting address:', address);
      
      // Load provinces, districts, and wards to match address
      const provinces = await onLoadProvinces();
      
      // Normalize address city name for matching
      const normalizedCity = normalizeName(address.city);
      
      // Find matching province (try multiple strategies)
      let province = provinces.find(p => {
        const normalizedP = normalizeName(p.name);
        return normalizedP === normalizedCity || 
               p.name === address.city ||
               p.name.includes(address.city) || 
               address.city.includes(p.name) ||
               normalizedP.includes(normalizedCity) ||
               normalizedCity.includes(normalizedP);
      });
      
      if (!province) {
        console.warn('[AddressSelector] Could not find matching province for:', address.city);
        console.warn('[AddressSelector] Available provinces:', provinces.map(p => p.name).slice(0, 5));
        // Still proceed - will fill form with text values even if codes don't match
        // This allows user to manually select from dropdowns
      }

      let districts: District[] = [];
      let wards: Ward[] = [];
      let district: District | undefined;

      if (province) {
        console.log('[AddressSelector] Found province:', province.name, 'code:', province.code);

        // Load districts
        districts = await onLoadDistricts(province.code.toString());
        
        // Normalize district name for matching
        const normalizedDistrict = normalizeName(address.district);
        
        // Find matching district
        district = districts.find(d => {
          const normalizedD = normalizeName(d.name);
          return normalizedD === normalizedDistrict ||
                 d.name === address.district ||
                 d.name.includes(address.district) || 
                 address.district.includes(d.name) ||
                 normalizedD.includes(normalizedDistrict) ||
                 normalizedDistrict.includes(normalizedD);
        });
        
        if (district) {
          console.log('[AddressSelector] Found district:', district.name, 'code:', district.code);
          
          // Load wards if district found
          wards = await onLoadWards(district.code.toString());
          
          // Try to find matching ward if address has ward
          if (address.ward) {
            const normalizedWard = normalizeName(address.ward);
            const ward = wards.find(w => {
              const normalizedW = normalizeName(w.name);
              return normalizedW === normalizedWard ||
                     w.name === address.ward ||
                     w.name.includes(address.ward) || 
                     address.ward.includes(w.name) ||
                     normalizedW.includes(normalizedWard) ||
                     normalizedWard.includes(normalizedW);
            });
            
            if (ward) {
              console.log('[AddressSelector] Found ward:', ward.name, 'code:', ward.code);
            } else {
              console.warn('[AddressSelector] Could not find matching ward for:', address.ward);
            }
          }
        } else {
          console.warn('[AddressSelector] Could not find matching district for:', address.district);
          console.warn('[AddressSelector] Available districts:', districts.map(d => d.name).slice(0, 5));
        }
      }

      // Always call parent callback - even if matching failed, we still want to fill form with text values
      onSelectAddress(address, provinces, districts, wards);
    } catch (error) {
      console.error('[AddressSelector] Error loading address data:', error);
    }
  };

  if (!isAuthenticated || addresses.length === 0) {
    return null;
  }

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <label className="flex items-center text-base font-semibold text-gray-900">
          <FaMapMarkerAlt className="mr-2 text-gray-600" />
          Chọn địa chỉ đã lưu
        </label>
        <button
          type="button"
          onClick={() => {
            setShowAddForm(true);
            setFormError('');
            if (provinces.length === 0) {
              loadProvincesForForm();
            }
          }}
          className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm hover:shadow-md"
        >
          <FaPlus className="text-xs" />
          Thêm địa chỉ mới
        </button>
      </div>

      {isOpen && (
        <div className="space-y-3 max-h-80 overflow-y-auto border-2 border-gray-200 rounded-xl p-4 bg-white shadow-sm">
          {addresses.map((address) => (
            <div
              key={address.id}
              onClick={() => handleSelectAddress(address)}
              className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                selectedAddressId === address.id
                  ? 'border-black bg-gray-100 shadow-md'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold text-gray-900 text-base">{address.recipientName}</p>
                    {address.isDefault && (
                      <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1.5">{address.phone}</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {address.addressLine}, {address.ward}, {address.district}, {address.city}
                  </p>
                </div>
                {selectedAddressId === address.id && (
                  <div className="ml-4 flex-shrink-0">
                    <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedAddress && !isOpen && !showAddForm && (
        <div className="p-4 border-2 border-gray-200 rounded-xl bg-gray-50 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <p className="font-semibold text-gray-900 text-base">{selectedAddress.recipientName}</p>
                {selectedAddress.isDefault && (
                  <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    Mặc định
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-1.5">{selectedAddress.phone}</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {selectedAddress.addressLine}, {selectedAddress.ward}, {selectedAddress.district}, {selectedAddress.city}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="p-2 text-white bg-black border-2 border-black rounded-lg hover:bg-gray-800 transition-colors flex-shrink-0 shadow-sm hover:shadow-md flex items-center justify-center"
              title="Đổi địa chỉ"
            >
              <GoSync  className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal thêm địa chỉ mới */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-xl rounded-lg shadow-lg">
            <div className="p-4 border-b flex items-center justify-between">
              <h4 className="font-medium">Thêm địa chỉ</h4>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormError('');
                  setNewAddressForm({
                    recipientName: '',
                    phone: '',
                    addressLine: '',
                    ward: '',
                    district: '',
                    city: '',
                    isDefault: false,
                  });
                  setDistricts([]);
                  setWards([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                className="px-4 py-3 border rounded"
                placeholder="Tên người nhận"
                value={newAddressForm.recipientName}
                onChange={(e) => setNewAddressForm({ ...newAddressForm, recipientName: e.target.value })}
              />
              <input
                className="px-4 py-3 border rounded"
                placeholder="Số điện thoại"
                value={newAddressForm.phone}
                onChange={(e) => setNewAddressForm({ ...newAddressForm, phone: e.target.value })}
              />
              <input
                className="px-4 py-3 border rounded md:col-span-2"
                placeholder="Địa chỉ"
                value={newAddressForm.addressLine}
                onChange={(e) => setNewAddressForm({ ...newAddressForm, addressLine: e.target.value })}
              />
              
              {/* Province/City Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tỉnh/Thành phố <span className="text-red-500">*</span>
                </label>
                <select
                  value={provinces.find(p => p.name === newAddressForm.city)?.code.toString() || ''}
                  onChange={async (e) => {
                    const code = e.target.value;
                    const selected = provinces.find(p => p.code.toString() === code);
                    if (selected) {
                      setNewAddressForm({ ...newAddressForm, city: selected.name, district: '', ward: '' });
                      setDistricts([]);
                      setWards([]);
                      await loadDistrictsForForm(code);
                    }
                  }}
                  className="w-full px-4 py-3 border rounded"
                  disabled={loading.provinces}
                >
                  <option value="">Chọn tỉnh/thành phố</option>
                  {provinces.map(province => (
                    <option key={province.code} value={province.code}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* District Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quận/Huyện <span className="text-red-500">*</span>
                </label>
                <select
                  value={districts.find(d => d.name === newAddressForm.district)?.code.toString() || ''}
                  onChange={async (e) => {
                    const code = e.target.value;
                    const selected = districts.find(d => d.code.toString() === code);
                    if (selected) {
                      setNewAddressForm({ ...newAddressForm, district: selected.name, ward: '' });
                      setWards([]);
                      await loadWardsForForm(code);
                    }
                  }}
                  className="w-full px-4 py-3 border rounded"
                  disabled={!newAddressForm.city || loading.districts}
                >
                  <option value="">Chọn quận/huyện</option>
                  {districts.map(district => (
                    <option key={district.code} value={district.code}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ward Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Xã/Phường/Thị trấn <span className="text-red-500">*</span>
                </label>
                <select
                  value={wards.find(w => w.name === newAddressForm.ward)?.code.toString() || ''}
                  onChange={(e) => {
                    const code = e.target.value;
                    const selected = wards.find(w => w.code.toString() === code);
                    if (selected) {
                      setNewAddressForm({ ...newAddressForm, ward: selected.name });
                    }
                  }}
                  className="w-full px-4 py-3 border rounded"
                  disabled={!newAddressForm.district || loading.wards}
                >
                  <option value="">Chọn xã/phường/thị trấn</option>
                  {wards.map(ward => (
                    <option key={ward.code} value={ward.code}>
                      {ward.name}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 md:col-span-2">
                <input
                  type="checkbox"
                  checked={newAddressForm.isDefault}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, isDefault: e.target.checked })}
                />
                <span>Đặt làm địa chỉ mặc định</span>
              </label>
            </div>
            {formError && (
              <div className="px-6 py-3 bg-red-50 border-l-4 border-red-500">
                <p className="text-sm text-red-700">{formError}</p>
              </div>
            )}
            <div className="p-4 border-t flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormError('');
                  setNewAddressForm({
                    recipientName: '',
                    phone: '',
                    addressLine: '',
                    ward: '',
                    district: '',
                    city: '',
                    isDefault: false,
                  });
                  setDistricts([]);
                  setWards([]);
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAddAddress}
                disabled={loading.saving}
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading.saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

