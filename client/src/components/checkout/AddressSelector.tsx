import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { addressService, type Address } from '../../services/address.service';
import type { CheckoutFormData, Province, District, Ward, ProvinceDetail, DistrictDetail } from '../../types';
import { FaMapMarkerAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';

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
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadAddresses();
    }
  }, [isAuthenticated, user]);

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
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-gray-700">
          <FaMapMarkerAlt className="inline mr-2" />
          Chọn địa chỉ đã lưu
        </label>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          {isOpen ? (
            <>
              <FaChevronUp className="text-xs" />
              Thu gọn
            </>
          ) : (
            <>
              <FaChevronDown className="text-xs" />
              Xem địa chỉ
            </>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
          {addresses.map((address) => (
            <div
              key={address.id}
              onClick={() => handleSelectAddress(address)}
              className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                selectedAddressId === address.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900">{address.recipientName}</p>
                    {address.isDefault && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{address.phone}</p>
                  <p className="text-sm text-gray-700">
                    {address.addressLine}, {address.ward}, {address.district}, {address.city}
                  </p>
                </div>
                {selectedAddressId === address.id && (
                  <div className="ml-3 text-blue-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedAddress && !isOpen && (
        <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{selectedAddress.recipientName}</p>
              <p className="text-sm text-gray-600">{selectedAddress.phone}</p>
              <p className="text-sm text-gray-700">
                {selectedAddress.addressLine}, {selectedAddress.ward}, {selectedAddress.district}, {selectedAddress.city}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Đổi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

