import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, MessageCircle, TrendingUp, Heart, Settings, Music4, BookOpen } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();

  const navItems = [
    { name: 'Feed', path: '/', icon: Home },
    { name: 'Communities', path: '/communities', icon: Users },
    { name: 'Messages', path: '/messages', icon: MessageCircle },
    { name: 'Music', path: '/music', icon: Music4 },
    { name: 'Stories', path: '/stories', icon: BookOpen },
    { name: 'Favorites', path: '/favorites', icon: Heart },
  ];

  return (
    <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
      <div className="p-4">
        {/* Navigation Links */}
        <nav className="space-y-1 mb-8">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                  ? 'bg-indigo-50 text-indigo-600 shadow-sm font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Quick Actions */}
        <div className="border-t border-gray-100 pt-4 mt-6">
          <NavLink
            to="/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </NavLink>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 px-2 font-medium">
            © 2025 HealWell
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
