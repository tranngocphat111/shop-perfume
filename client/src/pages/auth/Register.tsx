import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../contexts/AuthContext';

const Register: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        address: ''
    });
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear messages when user types
        if (error) setError('');
        if (success) setSuccess('');
    };

    const validateForm = (): boolean => {
        if (formData.name.length < 2) {
            setError('Tên phải có ít nhất 2 ký tự');
            return false;
        }

        if (formData.password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return false;
        }

        // Validate phone if provided
        if (formData.phone && !/^(\+84|0)[0-9]{9,10}$/.test(formData.phone)) {
            setError('Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678)');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const registerData = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone || undefined,
                address: formData.address || undefined
            };

            const response = await authService.register(registerData);
            login(response.token, response);

            setSuccess('Đăng ký thành công! Đang chuyển hướng...');

            // Redirect after 1 second
            setTimeout(() => {
                if (response.role === 'ADMIN') {
                    navigate('/admin');
                } else {
                    navigate('/');
                }
            }, 1000);
        } catch (err: any) {
            console.error('Register error:', err);
            setError(err.message || 'Đăng ký thất bại. Email có thể đã được sử dụng.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700 py-12 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-8 text-center">
                    <div className="text-4xl mb-2">🌸</div>
                    <h2 className="text-3xl font-bold">LAN Perfume</h2>
                    <p className="text-purple-100 mt-2">Tạo tài khoản mới</p>
                </div>

                {/* Body */}
                <div className="p-8">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start">
                            <span className="text-red-500 mr-2">⚠️</span>
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-start">
                            <span className="text-green-500 mr-2">✓</span>
                            <span className="text-sm">{success}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} id="registerForm">
                        <div className="mb-4">
                            <label className="block text-gray-700 font-semibold mb-2 flex items-center">
                                <span className="mr-2">👤</span>
                                Họ và tên <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition"
                                placeholder="Nhập họ và tên"
                                required
                                disabled={loading}
                                minLength={2}
                                maxLength={100}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 font-semibold mb-2 flex items-center">
                                <span className="mr-2">📧</span>
                                Email <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition"
                                placeholder="Nhập email"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2 flex items-center">
                                    <span className="mr-2">🔒</span>
                                    Mật khẩu <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition"
                                    placeholder="Nhập mật khẩu"
                                    required
                                    disabled={loading}
                                    minLength={6}
                                    maxLength={50}
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-2 flex items-center">
                                    <span className="mr-2">🔒</span>
                                    Xác nhận mật khẩu <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition"
                                    placeholder="Nhập lại mật khẩu"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2 flex items-center">
                                    <span className="mr-2">📱</span>
                                    Số điện thoại
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition"
                                    placeholder="VD: 0912345678"
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-2 flex items-center">
                                    <span className="mr-2">📍</span>
                                    Địa chỉ
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition"
                                    placeholder="Nhập địa chỉ"
                                    disabled={loading}
                                    maxLength={255}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={`w-full bg-gradient-to-r from-purple-600 to-indigo-700 text-white py-3 rounded-lg font-semibold transition-all ${
                                loading 
                                    ? 'opacity-70 cursor-not-allowed' 
                                    : 'hover:shadow-lg hover:scale-[1.02]'
                            }`}
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Đang xử lý...
                                </span>
                            ) : (
                                '✨ Đăng ký'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Đã có tài khoản? <Link to="/login" className="text-purple-600 font-semibold hover:underline">Đăng nhập</Link>
                        </p>
                        <Link to="/" className="inline-block mt-3 text-sm text-gray-500 hover:text-purple-600">
                            ← Quay về trang chủ
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
