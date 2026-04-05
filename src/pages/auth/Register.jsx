import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Mail, User, Phone, ArrowRight, Disc3 } from 'lucide-react';
import { motion } from 'framer-motion';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    const { confirmPassword, ...registerData } = formData;
    const result = await register(registerData);
    setLoading(false);

    if (result.success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_85%_10%,#ffffff_0%,#e6f0ff_35%,transparent_65%),radial-gradient(circle_at_10%_100%,#d7fbff_0%,transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef3fb_100%)]" />
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md my-8 vibio-panel p-7 sm:p-8"
      >
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30 mb-5"
            whileHover={{ rotate: 5 }}
          >
            <Disc3 className="w-7 h-7" />
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Create Vibio Account</h2>
          <p className="text-slate-600 text-sm">Join a network built for creators and communities</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 ml-1">
                Full Name
              </label>
              <div className="relative group">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={`vibio-input pr-12 ${errors.name ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                  required
                />
                <User className="absolute right-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              </div>
              {errors.name && <p className="text-red-500 text-xs ml-1 mt-1">{errors.name}</p>}
            </div>

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className={`vibio-input pr-12 ${errors.email ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                  required
                />
                <Mail className="absolute right-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              </div>
              {errors.email && <p className="text-red-500 text-xs ml-1 mt-1">{errors.email}</p>}
            </div>

            {/* Phone Field (Optional) */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 ml-1">
                Phone Number <span className="text-slate-500 font-normal text-xs">(Optional)</span>
              </label>
              <div className="relative group">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1234567890"
                  className="vibio-input pr-12"
                />
                <Phone className="absolute right-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 ml-1">
                Password
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`vibio-input pr-12 ${errors.password ? 'border-red-500 focus:border-red-500' : ''
                    }`}
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
              {errors.password && <p className="text-red-500 text-xs ml-1 mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 ml-1">
                Confirm Password
              </label>
              <div className="relative group">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`vibio-input pr-12 ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs ml-1 mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full vibio-btn-primary py-3.5 mt-2"
            >
              {loading ? (
                'Creating Account...'
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-blue-100" />
              <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium uppercase tracking-wider">OR</span>
              <div className="flex-grow border-t border-blue-100" />
            </div>

            <div className="text-center mb-2">
              <p className="text-slate-600 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-blue-700 hover:text-blue-600 hover:underline transition-all">
                  Sign In
                </Link>
              </p>
            </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;
