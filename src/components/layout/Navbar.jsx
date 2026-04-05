import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { communityService, userService, notificationService } from '../../services';
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
  Home,
  Users,
  MessageCircle,
  Music4,
  BookOpen,
  Disc3
} from 'lucide-react';
import { useClickOutside } from '../../hooks';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [requests, setRequests] = useState([]);
  const [communityRequests, setCommunityRequests] = useState([]);
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
      setUnreadCount(notifData.unreadCount || 0);
    } catch (error) {
      console.error(error);
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
    <nav className="sticky top-0 z-50 border-b border-blue-200/60 bg-white/85 backdrop-blur-lg">
      <div className="vibio-shell px-6 sm:px-8 xl:px-10 h-[5.5rem] flex items-center justify-between gap-6">

          {/* Left Side: Logo */}
          <div className="shrink-0">
            <NavLink to="/" className="flex items-center gap-3 group">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-xl shadow-blue-500/30">
                <Disc3 className="w-5.5 h-5.5" />
              </div>
              <div className="leading-tight">
                <span className="text-[1.35rem] font-bold tracking-[-0.03em] text-slate-900 group-hover:text-blue-700 transition-colors">
                  Vibio
                </span>
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-semibold mt-0.5">
                  Social Canvas
                </p>
              </div>
            </NavLink>
          </div>

          {/* Center: Search Bar */}
          <div className="hidden md:flex flex-1 justify-center max-w-2xl xl:max-w-3xl px-4 lg:px-10">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Vibio creators, communities, and moments"
                  className="vibio-input h-12 rounded-full pl-11 pr-5 text-sm bg-white border-blue-200/80 shadow-sm transition-all duration-200 hover:shadow-md focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(43,89,255,0.14),0_10px_18px_rgba(43,89,255,0.16)]"
                />

                <AnimatePresence>
                  {searchQuery && (searchResults.length > 0 || isSearching) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.18 }}
                      className="absolute top-full left-0 right-0 mt-2 vibio-panel overflow-hidden z-50 py-2"
                    >
                      {isSearching ? (
                        <div className="px-4 py-3 text-sm text-slate-500 text-center">Searching...</div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((searchedUser) => (
                          <div
                            key={searchedUser._id}
                            onClick={() => {
                              navigate(`/profile/${searchedUser._id}`);
                              setSearchQuery('');
                              setSearchResults([]);
                            }}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors"
                          >
                            <div className="w-8 h-8 rounded-full bg-blue-100 overflow-hidden shrink-0">
                              {searchedUser.profilePicUrl ? (
                                <img src={searchedUser.profilePicUrl} alt={searchedUser.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-cyan-500 text-white font-semibold text-xs">
                                  {searchedUser.name?.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-sm font-semibold text-slate-900 truncate">{searchedUser.name}</span>
                              <span className="text-xs text-slate-500 truncate">@{searchedUser.username || 'user'}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-slate-500 text-center">No users found</div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </div>

          {/* Right Side: Actions */}
          <div className="flex items-center gap-3 sm:gap-3.5">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/create-post')}
              className="hidden sm:flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 hover:brightness-105 transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              <Plus className="w-4 h-4" />
              <span>New Post</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/notifications')}
              className="relative p-2.5 rounded-full transition-all duration-200 text-slate-600 hover:bg-blue-100 hover:text-blue-700"
            >
              <Bell className="w-5 h-5" />
              {(requests.length > 0 || (communityRequests && communityRequests.length > 0) || unreadCount > 0) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-500 rounded-full border-2 border-white" />
              )}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-slate-600 hover:bg-blue-100 rounded-full transition-colors"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>

            <div className="relative" ref={profileMenuRef}>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="p-0.5 rounded-full hover:ring-2 hover:ring-blue-200 transition-all"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
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
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    className="absolute right-0 mt-2 w-60 vibio-panel py-1 z-50 origin-top-right"
                  >
                    <div className="px-4 py-3 border-b border-blue-100">
                      <p className="font-semibold text-sm text-slate-900 truncate">{user?.name}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          navigate('/profile');
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>Your Profile</span>
                      </button>
                      <button
                        onClick={() => {
                          navigate('/settings');
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                    </div>
                    <div className="border-t border-blue-100 py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-900 hover:bg-blue-50 transition-colors"
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
      

      {/* Mobile Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden border-t border-blue-200/60 bg-white/95 overflow-hidden"
          >
            <div className="vibio-shell py-4 space-y-3">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="vibio-input pl-10 pr-4 py-2.5 rounded-2xl text-sm"
                  />

                  {/* Mobile Search Results Dropdown */}
                  <AnimatePresence>
                    {searchQuery && (searchResults.length > 0 || isSearching) && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 right-0 mt-2 vibio-panel overflow-hidden z-50 py-2"
                      >
                        {isSearching ? (
                          <div className="px-4 py-3 text-sm text-slate-500 text-center">Searching...</div>
                        ) : searchResults.length > 0 ? (
                          searchResults.map((searchedUser) => (
                            <div
                              key={searchedUser._id}
                              onClick={() => {
                                navigate(`/profile/${searchedUser._id}`);
                                setSearchQuery('');
                                setSearchResults([]);
                                setShowMobileMenu(false);
                              }}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors"
                            >
                              <div className="w-8 h-8 rounded-full bg-blue-100 overflow-hidden shrink-0">
                                {searchedUser.profilePicUrl ? (
                                  <img src={searchedUser.profilePicUrl} alt={searchedUser.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-cyan-500 text-white font-semibold text-xs">
                                    {searchedUser.name?.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-semibold text-slate-900 truncate">{searchedUser.name}</span>
                                <span className="text-xs text-slate-500 truncate">@{searchedUser.username || 'user'}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-slate-500 text-center">No users found</div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </form>

              <div className="pt-3 border-t border-blue-100 flex flex-col gap-1">
                {navItems.map((item) => (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <NavLink
                      to={item.path}
                      onClick={() => setShowMobileMenu(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 ${isActive
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium'
                          : 'text-slate-700 hover:bg-blue-50'
                        }`
                      }
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium text-sm">{item.name}</span>
                    </NavLink>
                  </motion.div>
                ))}

                <button
                  onClick={() => {
                    navigate('/create-post');
                    setShowMobileMenu(false);
                  }}
                  className="w-full vibio-btn-primary mt-2"
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
