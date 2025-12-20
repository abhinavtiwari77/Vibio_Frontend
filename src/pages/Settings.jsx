import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Shield,
  Bell,
  Camera,
  Save,
  Lock,
  Mail,
  Smartphone,
  ChevronRight,
  LogOut
} from 'lucide-react';

const Settings = () => {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    email: user?.email || '',
  });
  const [profilePreview, setProfilePreview] = useState(user?.profilePicUrl);
  const [selectedFile, setSelectedFile] = useState(null);

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Notification State
  const [notifications, setNotifications] = useState({
    emailLike: user?.notificationPreferences?.emailLike ?? true,
    emailComment: user?.notificationPreferences?.emailComment ?? true,
    pushNewFollower: user?.notificationPreferences?.pushNewFollower ?? true,
    pushMessages: user?.notificationPreferences?.pushMessages ?? true
  });

  // Effect to update local state if user context updates (e.g. on mount)
  useEffect(() => {
    if (user?.notificationPreferences) {
      setNotifications({
        emailLike: user.notificationPreferences.emailLike ?? true,
        emailComment: user.notificationPreferences.emailComment ?? true,
        pushNewFollower: user.notificationPreferences.pushNewFollower ?? true,
        pushMessages: user.notificationPreferences.pushMessages ?? true
      });
    }
  }, [user]);

  const handleNotificationChange = async (key) => {
    const newVal = !notifications[key];
    const newNotifs = { ...notifications, [key]: newVal };
    setNotifications(newNotifs); // Optimistic update

    try {
      // Create FormData to match existing service structure or use JSON if supported
      // userService.updateMyProfile uses FormData usually, but we can verify if it handles JSON.
      // Looking at userService, it sends FormData. Let's send JSON data properly attached or just the logic
      // Actually backend updateMyProfile expects req.body fields.
      // We'll wrap it in a proper object for the service.

      // But userService.updateMyProfile implementation uses FormData?
      // "headers: { 'Content-Type': 'multipart/form-data' }"
      // We need to verify if we can send just JSON to that endpoint or if we need to append to FormData.
      // Ideally we should make a dedicated JSON endpoint or reuse properly.
      // Let's assume we append stringified JSON for now as implied by controller change.

      const formData = new FormData();
      formData.append('notificationPreferences', JSON.stringify(newNotifs));

      const res = await userService.updateMyProfile(formData);
      setUser(res.user);
      toast.success('Settings saved');
    } catch (error) {
      console.error(error);
      setNotifications({ ...notifications, [key]: !newVal }); // Revert
      toast.error('Failed to save settings');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', profileData.name);
      formData.append('bio', profileData.bio);
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      const res = await userService.updateMyProfile(formData);
      setUser(res.user);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    setIsLoading(true);
    try {
      await userService.updateMyProfile({
        currentPassword: passwordData.currentPassword,
        password: passwordData.newPassword
      });
      toast.success('Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.msg || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-6 mb-8">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100">
                  <img
                    src={profilePreview || user?.profilePicUrl || `https://ui-avatars.com/api/?name=${user?.name}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full cursor-pointer shadow-md hover:bg-indigo-700 transition-colors">
                  <Camera className="w-4 h-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Profile Photo</h3>
                <p className="text-sm text-gray-500">Update your public profile picture.</p>
              </div>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    placeholder="Your Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none min-h-[100px] resize-none"
                    placeholder="Tell us a little about yourself..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-md hover:shadow-lg"
                >
                  {isLoading ? 'Saving...' : <>Save Changes <Save className="w-4 h-4" /></>}
                </button>
              </div>
            </form>
          </motion.div>
        );

      case 'security':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Change Password</h3>
              <p className="text-sm text-gray-500">Ensure your account is secure by using a strong password.</p>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    placeholder="Enter current password"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    placeholder="Enter new password"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 shadow-md"
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </motion.div>
        );

      case 'notifications':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-6">Email Notifications</h3>
              <div className="space-y-4">
                {[
                  ['emailLike', 'Likes & Comments', 'Get notified when someone likes or comments on your post'],
                  ['emailComment', 'New Followers', 'Get notified when someone follows you']
                ].map(([key, title, desc]) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Mail className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{title}</p>
                        <p className="text-sm text-gray-500">{desc}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications[key]}
                        onChange={() => setNotifications({ ...notifications, [key]: !notifications[key] })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Push Notifications</h3>
              <div className="space-y-4">
                {[
                  ['pushNewFollower', 'New Messages', 'Get notified when you receive a message'],
                  ['pushMessages', 'Community Updates', 'Get notified about verified community updates']
                ].map(([key, title, desc]) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Smartphone className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{title}</p>
                        <p className="text-sm text-gray-500">{desc}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications[key]}
                        onChange={() => setNotifications({ ...notifications, [key]: !notifications[key] })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <MainLayout showRightSidebar={false}>
      <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8">

            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 shrink-0">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900">Settings</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage your account</p>
                </div>
                <nav className="p-2 space-y-1">
                  {[
                    { id: 'profile', icon: User, label: 'Edit Profile' },
                    { id: 'security', icon: Shield, label: 'Security' },
                    { id: 'notifications', icon: Bell, label: 'Notifications' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </div>
                      {activeTab === item.id && <ChevronRight className="w-4 h-4" />}
                    </button>
                  ))}
                </nav>
                <div className="p-4 border-t border-gray-100 mt-2">
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium">
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out Device</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 min-h-[500px]">
                <AnimatePresence mode="wait">
                  {renderContent()}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
