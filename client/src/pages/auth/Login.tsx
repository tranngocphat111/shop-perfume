import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../contexts/AuthContext';

const Login: React.FC = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear error when user types
        if (error) setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authService.login(formData);
            login(response.token, response);

            // Redirect based on role
            if (response.role === 'ADMIN') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700 py-12 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-8 text-center">
                    <div className="text-4xl mb-2">🌸</div>
                    <h2 className="text-3xl font-bold">LAN Perfume</h2>
                    <p className="text-purple-100 mt-2">Đăng nhập để tiếp tục</p>
                </div>

                {/* Body */}
                <div className="p-8">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start">
                            <span className="text-red-500 mr-2">⚠️</span>
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-semibold mb-2 flex items-center">
                                <span className="mr-2">📧</span>
                                Email
                            </label>
                            <div className="relative">
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
                        </div>

                        <div className="mb-6">
                            <label className="block text-gray-700 font-semibold mb-2 flex items-center">
                                <span className="mr-2">🔒</span>
                                Mật khẩu
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition"
                                    placeholder="Nhập mật khẩu"
                                    required
                                    disabled={loading}
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
                                '🚀 Đăng nhập'
                            )}
                        </button>
                    </form>

                    {/* Demo Info */}
                    <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-100">
                        <p className="text-sm font-semibold text-purple-800 mb-2 flex items-center">
                            <span className="mr-2">ℹ️</span>
                            Tài khoản demo:
                        </p>
                        <ul className="text-sm text-purple-700 space-y-1 ml-6">
                            <li>• Admin: <code className="bg-white px-2 py-1 rounded">admin@example.com</code> / <code className="bg-white px-2 py-1 rounded">123456</code></li>
                            <li>• User: <code className="bg-white px-2 py-1 rounded">user@example.com</code> / <code className="bg-white px-2 py-1 rounded">123456</code></li>
                        </ul>
                    </div>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Chưa có tài khoản? <Link to="/register" className="text-purple-600 font-semibold hover:underline">Đăng ký ngay</Link>
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

export default Login;
