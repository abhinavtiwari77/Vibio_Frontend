import { Compass, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RightSidebar = () => {
  const navigate = useNavigate();
  const quickTopics = ['Design', 'Music', 'Photography', 'Startups', 'Fitness'];

  return (
    <aside className="hidden xl:block xl:sticky xl:top-[5.6rem] xl:h-[calc(100vh-6.5rem)] overflow-y-auto">
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => navigate('/create-post')}
          className="w-full text-left bg-transparent rounded-[1.4rem] p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-slate-900">Creative Prompt</h3>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            Share one visual or story today that captures your current mood in exactly three words.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-500/25">
            Start a Post
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>

        <div className="bg-transparent rounded-[1.4rem] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Compass className="w-4 h-4 text-cyan-600" />
            <h3 className="font-semibold text-slate-900">Trending Circles</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickTopics.map((topic) => (
              <button
                type="button"
                key={topic}
                onClick={() => navigate('/communities')}
                className="rounded-xl bg-white px-3 py-1 text-xs font-semibold text-blue-700"
              >
                #{topic}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
