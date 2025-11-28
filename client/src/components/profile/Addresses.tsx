import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@contexts/AuthContext";
import { addressService, type Address } from "../../services/address.service";
import type { Province, District, Ward, ProvinceDetail, DistrictDetail } from "../../types";

const PROVINCES_API = 'https://provinces.open-api.vn/api/p/';
const DISTRICTS_API = 'https://provinces.open-api.vn/api/d/';

export const Addresses = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState<Omit<Address, "id">>({
    recipientName: "",
    phone: "",
    addressLine: "",
    ward: "",
    district: "",
    city: "",
    isDefault: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // For dropdowns
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState({
    provinces: false,
    districts: false,
    wards: false,
  });

  useEffect(() => {
    if (user && isAuthenticated) {
      loadAddresses();
    }
  }, [user, isAuthenticated]);

  // Auto-open modal if navigating from checkout to add address
  useEffect(() => {
    const state = location.state as { action?: string } | null;
    if (state?.action === 'add') {
      setShowModal(true);
      setEditing(null);
      setForm({
        recipientName: "",
        phone: "",
        addressLine: "",
        ward: "",
        district: "",
        city: "",
        isDefault: false,
      });
    }
  }, [location]);

  const loadAddresses = async () => {
    try {
      const savedAddresses = await addressService.getAddresses();
      setAddresses(savedAddresses);
    } catch (error) {
      console.error('Error loading addresses:', error);
      setError('Không thể tải danh sách địa chỉ');
    }
  };

  // Load provinces when modal opens
  useEffect(() => {
    if (showModal && provinces.length === 0) {
      loadProvinces();
    }
  }, [showModal]);

  // Auto-load districts when editing address with city
  useEffect(() => {
    if (showModal && editing && form.city && provinces.length > 0 && districts.length === 0) {
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
  }, [showModal, editing, form.city, provinces.length]);

  // Auto-load wards when editing address with district
  useEffect(() => {
    if (showModal && editing && form.district && districts.length > 0 && wards.length === 0) {
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
  }, [showModal, editing, form.district, districts.length]);

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

  const openAdd = () => {
    setEditing(null);
    setForm({
      recipientName: user?.name || "",
      phone: "",
      addressLine: "",
      ward: "",
      district: "",
      city: "",
      isDefault: addresses.length === 0,
    });
    setShowModal(true);
  };

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

  const openEdit = (a: Address) => {
    setEditing(a);
    setForm({
      recipientName: a.recipientName,
      phone: a.phone,
      addressLine: a.addressLine,
      ward: a.ward,
      district: a.district,
      city: a.city,
      isDefault: a.isDefault,
    });
    setShowModal(true);
    // Reset districts and wards when opening edit
    setDistricts([]);
    setWards([]);
  };

  const save = async () => {
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
      if (editing) {
        await addressService.updateAddress(editing.id, form);
        setSuccess("Cập nhật địa chỉ thành công!");
      } else {
        await addressService.createAddress(form);
        setSuccess("Thêm địa chỉ mới thành công!");
      }
      
      // Reload addresses
      await loadAddresses();
      
      setShowModal(false);
      setError("");
      setTimeout(() => setSuccess(""), 2000);
    } catch (error: any) {
      setError(error.message || "Có lỗi xảy ra khi lưu địa chỉ");
    }
  };

  const remove = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) {
      try {
        await addressService.deleteAddress(id);
        setSuccess("Xóa địa chỉ thành công!");
        // Reload addresses
        await loadAddresses();
        setTimeout(() => setSuccess(""), 2000);
      } catch (error: any) {
        setError(error.message || "Có lỗi xảy ra khi xóa địa chỉ");
      }
    }
  };

  const setDefault = async (id: number) => {
    try {
      await addressService.setDefaultAddress(id);
      setSuccess("Đã đặt làm địa chỉ mặc định!");
      // Reload addresses
      await loadAddresses();
      setTimeout(() => setSuccess(""), 2000);
    } catch (error: any) {
      setError(error.message || "Có lỗi xảy ra khi đặt địa chỉ mặc định");
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Địa chỉ giao hàng</h3>
        <button
          type="button"
          onClick={openAdd}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
        >
          Thêm địa chỉ
        </button>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded">{success}</div>
      )}

      <div className="space-y-3">
        {addresses.map((a) => (
          <div
            key={a.id}
            className="flex items-start justify-between p-4 border border-gray-200 rounded-lg"
          >
            <div>
              <p className="font-medium">{a.recipientName}</p>
              <p className="text-sm text-gray-600">{a.phone}</p>
              <p className="text-sm text-gray-700">
                {a.addressLine}, {a.ward}, {a.district}, {a.city}
              </p>
              {a.isDefault && (
                <span className="mt-2 inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Mặc định</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => openEdit(a)}
                className="px-3 py-2 border rounded hover:bg-gray-50"
              >
                Sửa
              </button>
              <button
                type="button"
                onClick={() => setDefault(a.id)}
                className="px-3 py-2 border rounded hover:bg-gray-50"
              >
                Đặt mặc định
              </button>
              <button
                type="button"
                onClick={() => remove(a.id)}
                className="px-3 py-2 border rounded hover:bg-red-50 text-red-600"
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-xl rounded-lg shadow-lg">
            <div className="p-4 border-b flex items-center justify-between">
              <h4 className="font-medium">{editing ? "Sửa địa chỉ" : "Thêm địa chỉ"}</h4>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setError("");
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
                value={form.recipientName}
                onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
              />
              <input
                className="px-4 py-3 border rounded"
                placeholder="Số điện thoại"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <input
                className="px-4 py-3 border rounded md:col-span-2"
                placeholder="Địa chỉ"
                value={form.addressLine}
                onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
              />
              
              {/* Province/City Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tỉnh/Thành phố <span className="text-red-500">*</span>
                </label>
                <select
                  value={provinces.find(p => p.name === form.city)?.code.toString() || ''}
                  onChange={async (e) => {
                    const code = e.target.value;
                    const selected = provinces.find(p => p.code.toString() === code);
                    if (selected) {
                      setForm({ ...form, city: selected.name, district: '', ward: '' });
                      setDistricts([]);
                      setWards([]);
                      await loadDistricts(code);
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
                  value={districts.find(d => d.name === form.district)?.code.toString() || ''}
                  onChange={async (e) => {
                    const code = e.target.value;
                    const selected = districts.find(d => d.code.toString() === code);
                    if (selected) {
                      setForm({ ...form, district: selected.name, ward: '' });
                      setWards([]);
                      await loadWards(code);
                    }
                  }}
                  className="w-full px-4 py-3 border rounded"
                  disabled={!form.city || loading.districts}
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
                  value={wards.find(w => w.name === form.ward)?.code.toString() || ''}
                  onChange={(e) => {
                    const code = e.target.value;
                    const selected = wards.find(w => w.code.toString() === code);
                    if (selected) {
                      setForm({ ...form, ward: selected.name });
                    }
                  }}
                  className="w-full px-4 py-3 border rounded"
                  disabled={!form.district || loading.wards}
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
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                />
                <span>Đặt làm địa chỉ mặc định</span>
              </label>
            </div>
            {error && (
              <div className="px-6 py-3 bg-red-50 border-l-4 border-red-500">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <div className="p-4 border-t flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setError("");
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={save}
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

