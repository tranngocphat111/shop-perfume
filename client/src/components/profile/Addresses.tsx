import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MapPin, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@contexts/AuthContext";
import { addressService, type Address } from "../../services/address.service";
import { AddressList } from "./AddressList";
import { AddressFormModal } from "./AddressFormModal";

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

  const openEdit = (address: Address) => {
    setEditing(address);
    setForm({
      recipientName: address.recipientName,
      phone: address.phone,
      addressLine: address.addressLine,
      ward: address.ward,
      district: address.district,
      city: address.city,
      isDefault: address.isDefault,
    });
    setShowModal(true);
  };

  const handleSave = async (formData: Omit<Address, "id">) => {
    try {
      if (editing) {
        await addressService.updateAddress(editing.id, formData);
        setSuccess("Cập nhật địa chỉ thành công!");
      } else {
        await addressService.createAddress(formData);
        setSuccess("Thêm địa chỉ mới thành công!");
      }
      
      await loadAddresses();
      setTimeout(() => setSuccess(""), 2000);
    } catch (error: any) {
      throw error;
    }
  };

  const handleDelete = async (id: number) => {
    // Find the address to check if it's default
    const addressToDelete = addresses.find(addr => addr.id === id);
    
    if (!addressToDelete) {
      setError("Không tìm thấy địa chỉ cần xóa");
      setTimeout(() => setError(""), 3000);
      return;
    }

    // Check if trying to delete default address
    if (addressToDelete.isDefault) {
      setError("Không thể xóa địa chỉ mặc định. Vui lòng đặt địa chỉ khác làm mặc định trước.");
      setTimeout(() => setError(""), 4000);
      return;
    }

    try {
      setError(""); // Clear any previous errors
      setSuccess(""); // Clear any previous success messages
      
      await addressService.deleteAddress(id);
      
      // If we get here, deletion was successful
      setSuccess("Xóa địa chỉ thành công!");
      await loadAddresses();
      setTimeout(() => setSuccess(""), 2000);
    } catch (error: any) {
      // Extract error message properly
      let errorMessage = "Có lỗi xảy ra khi xóa địa chỉ";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setError(errorMessage);
      setSuccess(""); // Clear success message if error occurs
      setTimeout(() => setError(""), 4000);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await addressService.setDefaultAddress(id);
      setSuccess("Đã đặt làm địa chỉ mặc định!");
      await loadAddresses();
      setTimeout(() => setSuccess(""), 2000);
    } catch (error: any) {
      setError(error.message || "Có lỗi xảy ra khi đặt địa chỉ mặc định");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
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
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <MapPin size={20} className="text-gray-700" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Địa chỉ giao hàng</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {addresses.length} {addresses.length === 1 ? 'địa chỉ' : 'địa chỉ'}
            </p>
          </div>
        </div>
        <motion.button
          type="button"
          onClick={openAdd}
          className="btn-slide-overlay-dark relative overflow-hidden flex items-center gap-2 px-5 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors shadow-sm"
        >
          <Plus size={16} className="relative z-10" />
          <span className="relative z-10 text-sm">Thêm địa chỉ</span>
        </motion.button>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Success Message */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg"
            >
              <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
              <p className="text-sm font-medium text-green-700">{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <XCircle size={18} className="text-red-600 flex-shrink-0" />
              <p className="text-sm font-medium text-red-700">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Address List */}
        <AddressList
          addresses={addresses}
          onEdit={openEdit}
          onDelete={handleDelete}
          onSetDefault={handleSetDefault}
        />
      </div>

      {/* Modal */}
      <AddressFormModal
        isOpen={showModal}
        editing={editing}
        initialForm={form}
        onClose={handleCloseModal}
        onSave={handleSave}
        userDefaultName={user?.name}
      />
    </div>
  );
};

