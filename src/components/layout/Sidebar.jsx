import { NavLink } from 'react-router-dom';
import { Home, Users, MessageCircle, Heart, Settings, Music4, BookOpen } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { name: 'Feed', path: '/', icon: Home },
    { name: 'Communities', path: '/communities', icon: Users },
    { name: 'Messages', path: '/messages', icon: MessageCircle },
    { name: 'Music', path: '/music', icon: Music4 },
    { name: 'Stories', path: '/stories', icon: BookOpen },
    { name: 'Favorites', path: '/favorites', icon: Heart },
  ];

  return (
    <aside className="hidden lg:block lg:sticky lg:top-[5.6rem] lg:h-[calc(100vh-6.5rem)] overflow-y-auto">
      <div className="bg-transparent p-0 overflow-hidden">
        <div className="p-3 pt-4">
          <nav className="space-y-1.5 mb-6">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-4 py-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${isActive
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25 font-medium'
                  : 'text-slate-600 hover:bg-blue-50 hover:text-slate-900'
                }`
              }
            >
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/20">
                <item.icon className="w-[18px] h-[18px]" />
              </span>
              <span className="font-medium leading-none">{item.name}</span>
            </NavLink>
          ))}
          </nav>

          <div className="bg-transparent p-3">
            <NavLink
              to="/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-white/80 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              <Settings className="w-[18px] h-[18px]" />
              <span className="font-medium text-sm">Settings</span>
            </NavLink>
          </div>

          <div className="mt-5 pt-4 px-2">
            <p className="text-xs text-slate-500 font-medium">© 2026 Vibio</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
