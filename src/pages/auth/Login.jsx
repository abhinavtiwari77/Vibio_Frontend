import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, Heart, Activity, Stethoscope } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-teal-400 via-cyan-500 to-teal-600 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating DNA Icon */}
        <div className="absolute top-20 left-20 animate-float">
          <div className="w-32 h-32 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Activity className="w-16 h-16 text-white/40" strokeWidth={1.5} />
          </div>
        </div>

        {/* Floating Heart Icon */}
        <div className="absolute bottom-32 right-32 animate-float-delayed">
          <div className="w-40 h-40 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Heart className="w-20 h-20 text-white/40" strokeWidth={1.5} />
          </div>
        </div>

        {/* Floating Stethoscope */}
        <div className="absolute top-1/2 right-20 animate-float">
          <div className="w-36 h-36 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Stethoscope className="w-18 h-18 text-white/40" strokeWidth={1.5} />
          </div>
        </div>

        {/* EKG Line */}
        <svg className="absolute bottom-0 left-0 w-full h-24 text-white/20" viewBox="0 0 1200 100" preserveAspectRatio="none">
          <path d="M0,50 L200,50 L220,30 L240,70 L260,50 L1200,50" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo/Icon at top */}
        <div className="flex justify-center mb-6 animate-bounce-slow">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
            <div className="text-white text-3xl font-bold">+</div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-sm">
          {/* Logo Icon inside card */}
          <div className="flex justify-center -mt-16 mb-6">
            <div className="w-16 h-16 bg-teal-500 rounded-2xl flex items-center justify-center shadow-lg rotate-45">
              <div className="text-white text-2xl font-bold -rotate-45">+</div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-700 text-center mb-2">Welcome Back!</h2>
          <p className="text-gray-500 text-center mb-8 text-sm">Sign in to continue your wellness journey</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Email or No. Handphone
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="suardi@gmail.co.id"
                  className="w-full px-4 py-3 pr-10 border-b-2 border-gray-300 focus:border-teal-500 outline-none transition-colors bg-transparent text-gray-700"
                  required
                />
                <Mail className="absolute right-2 top-3 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-10 border-b-2 border-gray-300 focus:border-teal-500 outline-none transition-colors bg-transparent text-gray-700"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <Link to="/forgot-password" className="text-sm text-teal-500 hover:text-teal-600">
                  Forgot Password?
                </Link>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Signing In...' : 'SIGN IN'}
            </button>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-gray-500 text-sm">OR</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-medium py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-md"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="text-center mt-8 text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-teal-500 hover:text-teal-600 font-semibold">
              Sign Up
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Login;
