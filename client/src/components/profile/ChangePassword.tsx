import { useState } from "react";

export const ChangePassword = () => {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (next.length < 6) {
      setError("Mật khẩu mới tối thiểu 6 ký tự");
      return;
    }
    if (next !== confirm) {
      setError("Xác nhận mật khẩu không khớp");
      return;
    }
    setSuccess("Đổi mật khẩu thành công (demo)");
    setTimeout(() => setSuccess(""), 2000);
    setCurrent("");
    setNext("");
    setConfirm("");
  };

  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium mb-4">Đổi mật khẩu</h3>
      {error && <div className="mb-3 p-3 bg-red-50 text-red-700 rounded">{error}</div>}
      {success && <div className="mb-3 p-3 bg-green-50 text-green-700 rounded">{success}</div>}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <input
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="Mật khẩu hiện tại"
          className="w-full px-4 py-3 border rounded"
        />
        <input
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder="Mật khẩu mới"
          className="w-full px-4 py-3 border rounded"
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Xác nhận mật khẩu mới"
          className="w-full px-4 py-3 border rounded"
        />
        <button type="submit" className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800">Đổi mật khẩu</button>
      </form>
    </div>
  );
};

