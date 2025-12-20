import { Heart, TrendingUp, Users, MessageCircle } from 'lucide-react';

const RightSidebar = () => {
  return (
    <aside className="hidden xl:block w-80 bg-white border-l border-gray-200 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Wellness Tip */}
        <div className="card bg-indigo-50 border-indigo-100">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-5 h-5 text-indigo-600" fill="currentColor" />
            <h3 className="font-semibold text-indigo-900">Daily Wellness Tip</h3>
          </div>
          <p className="text-sm text-indigo-800 leading-relaxed font-medium">
            Take a 5-minute break every hour to stretch and breathe deeply. Your mind and body will thank you.
          </p>
        </div>

        {/* Community Guidelines */}
        <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs text-gray-500 leading-relaxed font-medium">
            <a href="/terms" className="hover:text-indigo-600 transition-colors">Terms</a>
            {' • '}
            <a href="/privacy" className="hover:text-indigo-600 transition-colors">Privacy</a>
            {' • '}
            <a href="/guidelines" className="hover:text-indigo-600 transition-colors">Guidelines</a>
          </p>
          <p className="text-xs text-gray-400 mt-2">© 2025 HealWell</p>
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
