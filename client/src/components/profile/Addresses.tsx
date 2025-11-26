import { useState, useEffect } from "react";
import { useAuth } from "@contexts/AuthContext";

interface Address {
  id: number;
  recipientName: string;
  phone: string;
  addressLine: string;
  ward: string;
  district: string;
  city: string;
  isDefault: boolean;
}

export const Addresses = () => {
  const { user } = useAuth();
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
    if (user) {
      setAddresses([
        {
          id: 1,
          recipientName: user.name,
          phone: "0912345678",
          addressLine: "123 Đường ABC",
          ward: "Phường 1",
          district: "Quận 1",
          city: "TP. Hồ Chí Minh",
          isDefault: true,
        },
      ]);
    }
  }, [user]);

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
  };

  const save = () => {
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

    if (editing) {
      setAddresses(
        addresses.map((x) =>
          x.id === editing.id
            ? { ...form, id: editing.id }
            : form.isDefault
            ? { ...x, isDefault: false }
            : x
        )
      );
      setSuccess("Cập nhật địa chỉ thành công!");
    } else {
      const updated = form.isDefault
        ? addresses.map((x) => ({ ...x, isDefault: false }))
        : addresses;
      setAddresses([...updated, { ...form, id: Date.now() }]);
      setSuccess("Thêm địa chỉ mới thành công!");
    }
    setShowModal(false);
    setError("");
    setTimeout(() => setSuccess(""), 2000);
  };

  const remove = (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) {
      setAddresses(addresses.filter((x) => x.id !== id));
      setSuccess("Xóa địa chỉ thành công!");
      setTimeout(() => setSuccess(""), 2000);
    }
  };

  const setDefault = (id: number) => {
    setAddresses(addresses.map((x) => ({ ...x, isDefault: x.id === id })));
    setSuccess("Đã đặt làm địa chỉ mặc định!");
    setTimeout(() => setSuccess(""), 2000);
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
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>
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
              <input
                className="px-4 py-3 border rounded"
                placeholder="Phường/Xã"
                value={form.ward}
                onChange={(e) => setForm({ ...form, ward: e.target.value })}
              />
              <input
                className="px-4 py-3 border rounded"
                placeholder="Quận/Huyện"
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
              />
              <input
                className="px-4 py-3 border rounded"
                placeholder="Tỉnh/Thành phố"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
              <label className="flex items-center gap-2 md:col-span-2">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                />
                <span>Đặt làm địa chỉ mặc định</span>
              </label>
            </div>
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

