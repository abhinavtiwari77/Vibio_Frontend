import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { communityService, userService, notificationService } from '../../services';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Search,
  Menu,
  X,
  LogOut,
  Settings,
  User,
  Heart,
  Plus,
  ChevronDown,
  Home,
  Users,
  MessageCircle,
  Music4,
  BookOpen
} from 'lucide-react';
import { useClickOutside } from '../../hooks';

const Navbar = () => {
  const { user, logout, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [requests, setRequests] = useState([]);
  const [communityRequests, setCommunityRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems = [
    { name: 'Feed', path: '/', icon: Home },
    { name: 'Communities', path: '/communities', icon: Users },
    { name: 'Messages', path: '/messages', icon: MessageCircle },
    { name: 'Music', path: '/music', icon: Music4 },
    { name: 'Stories', path: '/stories', icon: BookOpen },
    { name: 'Favorites', path: '/favorites', icon: Heart },
    { name: 'Settings', path: '/settings', icon: Settings }
  ];

  const profileMenuRef = useClickOutside(() => setShowProfileMenu(false));


  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  // Poll for notifications
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        try {
          const data = await userService.searchUsers(searchQuery);
          setSearchResults(data.users || []);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchRequests = async () => {
    try {
      const [userData, comData, notifData] = await Promise.all([
        userService.getFollowRequests(),
        communityService.getPendingRequests(),
        notificationService.getNotifications()
      ]);
      setRequests(userData.requests);
      setCommunityRequests(comData.communities);
      setNotifications(notifData.notifications || []);
      setUnreadCount(notifData.unreadCount || 0);
    } catch (error) {
      console.error(error);
    }
  };



  const handleCommunityAction = async (communityId, userId, action) => {
    try {
      if (action === 'approve') {
        await communityService.approveRequest(communityId, userId);
        toast.success('Member approved');
      } else {
        await communityService.rejectRequest(communityId, userId);
        toast.success('Request rejected');
      }
      fetchRequests();
    } catch (error) {
      console.error(error);
      toast.error('Action failed');
    }
  };

  const handleAcceptRequest = async (id) => {
    try {
      await userService.acceptFollowRequest(id);
      toast.success('Request accepted');
      setRequests(requests.filter(req => req._id !== id));
      if (checkAuth) checkAuth();
    } catch (error) {
      console.error(error);
      toast.error('Failed to accept request');
    }
  };

  const handleRejectRequest = async (id) => {
    try {
      await userService.rejectFollowRequest(id);
      toast.success('Request rejected');
      setRequests(requests.filter(req => req._id !== id));
    } catch (error) {
      console.error(error);
      toast.error('Failed to reject request');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${searchQuery}`);
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-sm transition-all duration-300">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Left Side: Logo */}
          <div className="shrink-0">
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <div className="absolute inset-0 bg-teal-100 rounded-xl rotate-3 group-hover:rotate-6 transition-transform duration-300"></div>
                <div className="relative w-10 h-10 bg-linear-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
                  <Heart className="w-5 h-5 text-white" fill="currentColor" strokeWidth={2.5} />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-slate-900 tracking-tight leading-none group-hover:text-teal-600 transition-colors">
                  HealWell
                </span>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider leading-none">
                  We care
                </span>
              </div>
            </NavLink>
          </div>

          {/* Center: Search Bar */}
          <div className="hidden md:flex flex-1 justify-center max-w-lg px-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search HealWell..."
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm transition-all"
                />

                {/* Search Results Dropdown */}
                <AnimatePresence>
                  {searchQuery && (searchResults.length > 0 || isSearching) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 py-2"
                    >
                      {isSearching ? (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">Searching...</div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((user) => (
                          <div
                            key={user._id}
                            onClick={() => {
                              navigate(`/profile/${user._id}`);
                              setSearchQuery('');
                              setSearchResults([]);
                            }}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
                              {user.profilePicUrl ? (
                                <img src={user.profilePicUrl} alt={user.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-teal-500 text-white font-semibold text-xs">
                                  {user.name?.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-sm font-medium text-gray-900 truncate">{user.name}</span>
                              <span className="text-xs text-gray-500 truncate">@{user.username || 'user'}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">No users found</div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </div>

          {/* Right Side: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Create Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/create-post')}
              className="hidden sm:flex items-center gap-2 bg-linear-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xl:inline">Create</span>
            </motion.button>

            {/* Notifications */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/notifications')}
              className="relative p-2.5 rounded-full transition-all duration-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              <Bell className="w-5 h-5" />
              {(requests.length > 0 || (communityRequests && communityRequests.length > 0) || unreadCount > 0) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </motion.button>



            {/* Mobile Menu Button - Moved before Profile */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>

            {/* Profile Menu */}
            <div className="relative" ref={profileMenuRef}>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="p-0.5 rounded-full hover:ring-2 hover:ring-gray-200 transition-all"
              >
                <div className="w-9 h-9 bg-linear-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                  {user?.profilePicUrl ? (
                    <img src={user.profilePicUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    user?.name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
              </motion.button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50 origin-top-right"
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-sm text-gray-900 truncate">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          navigate('/profile');
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>Your Profile</span>
                      </button>
                      {/* <button
                        onClick={() => {
                          navigate('/settings');
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button> */}
                    </div>
                    <div className="border-t border-gray-100 py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>


          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden border-t border-gray-100 bg-white overflow-hidden shadow-lg"
          >
            <div className="px-4 py-4 space-y-3">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                  />

                  {/* Mobile Search Results Dropdown */}
                  <AnimatePresence>
                    {searchQuery && (searchResults.length > 0 || isSearching) && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 py-2"
                      >
                        {isSearching ? (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">Searching...</div>
                        ) : searchResults.length > 0 ? (
                          searchResults.map((user) => (
                            <div
                              key={user._id}
                              onClick={() => {
                                navigate(`/profile/${user._id}`);
                                setSearchQuery('');
                                setSearchResults([]);
                                setShowMobileMenu(false);
                              }}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
                                {user.profilePicUrl ? (
                                  <img src={user.profilePicUrl} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-teal-500 text-white font-semibold text-xs">
                                    {user.name?.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-medium text-gray-900 truncate">{user.name}</span>
                                <span className="text-xs text-gray-500 truncate">@{user.username || 'user'}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">No users found</div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </form>

              <div className="pt-3 border-t border-gray-50 flex flex-col gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setShowMobileMenu(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive
                        ? 'bg-indigo-50 text-indigo-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{item.name}</span>
                  </NavLink>
                ))}

                <button
                  onClick={() => {
                    navigate('/create-post');
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-xl hover:bg-indigo-700 transition-colors font-medium text-sm shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Post</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
