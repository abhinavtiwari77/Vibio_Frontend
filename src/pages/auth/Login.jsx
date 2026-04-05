import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Mail, ArrowRight, Disc3 } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(formData.email, formData.password);
    setLoading(false);

    if (result.success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,#ffffff_0%,#e8efff_37%,transparent_62%),radial-gradient(circle_at_85%_0%,#d7fbff_0%,transparent_35%),linear-gradient(180deg,#f8fbff_0%,#eef3fb_100%)]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[430px] my-6 vibio-panel p-6 sm:p-7"
      >
        <div className="text-center mb-7">
          <motion.div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-xl shadow-blue-500/30 mb-4"
            whileHover={{ rotate: 6 }}
          >
            <Disc3 className="w-7 h-7" />
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1.5">Welcome to Vibio</h2>
          <p className="text-slate-600 text-sm">Sign in to continue your social canvas.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4.5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 ml-1">
                Username or Email
              </label>
              <div className="relative group">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="vibio-input pr-12"
                  required
                />
                <Mail className="absolute right-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 ml-1">
                Password
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="vibio-input pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <span className="text-xs text-slate-500">Secure login</span>
              <Link to="/forgot-password" className="text-sm font-medium text-blue-700 hover:text-blue-600 hover:underline transition-all">
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full vibio-btn-primary py-3 mt-1"
            >
              {loading ? (
                'Signing In...'
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex items-center py-1.5">
              <div className="flex-grow border-t border-blue-100" />
              <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium uppercase tracking-wider">OR</span>
              <div className="flex-grow border-t border-blue-100" />
            </div>

            <div className="text-center">
              <p className="text-slate-600 text-sm">
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold text-blue-700 hover:text-blue-600 hover:underline transition-all">
                  Sign up
                </Link>
              </p>
            </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
