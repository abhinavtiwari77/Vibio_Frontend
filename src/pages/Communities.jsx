import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import CommunityCard from '../components/community/CommunityCard';
import CreateCommunityModal from '../components/community/CreateCommunityModal';
import { Plus, Search, TrendingUp, Users, Loader } from 'lucide-react';
import { communityService } from '../services';
import toast from 'react-hot-toast';
import { useDebounce } from '../hooks';

const Communities = () => {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    fetchCommunities();
  }, [debouncedSearch]);

  const fetchCommunities = async () => {
    setLoading(true);
    try {
      const data = await communityService.listCommunities(debouncedSearch);
      setCommunities(data.communities || data || []);
    } catch (error) {
      console.error('Error fetching communities:', error);
      toast.error('Failed to load communities');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCommunity = async (community) => {
    try {
      await communityService.joinCommunity(community._id);
      if (community.isPrivate) {
        toast.success('Join request sent!');
        fetchCommunities();
      } else {
        toast.success('Joined community!');
        navigate(`/communities/${community.slug || community._id}`);
      }
    } catch (error) {
      console.error('Error joining community:', error);
      toast.error(error.response?.data?.msg || 'Failed to join community');
    }
  };

  const handleCommunityCreated = () => {
    fetchCommunities();
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Communities</h1>
              <p className="text-slate-600">Join communities and connect with others on their wellness journey</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 btn-primary"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Create Community</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search communities..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card bg-indigo-50/50 border-indigo-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{communities.length}</p>
                <p className="text-sm text-slate-600">Communities</p>
              </div>
            </div>
          </div>

          <div className="card bg-purple-50/50 border-purple-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {communities.reduce((acc, c) => acc + (c.members?.length || 0), 0)}
                </p>
                <p className="text-sm text-slate-600">Total Members</p>
              </div>
            </div>
          </div>

          <div className="card bg-slate-50/50 border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center">
                <Plus className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {communities.filter(c => !c.isPrivate).length}
                </p>
                <p className="text-sm text-slate-600">Public Communities</p>
              </div>
            </div>
          </div>
        </div>

        {/* Communities Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : communities.length === 0 ? (
          <div className="card text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-600 mb-2">
              {searchQuery ? 'No communities found' : 'No communities yet'}
            </p>
            <p className="text-sm text-slate-500 mb-4">
              {searchQuery
                ? 'Try a different search term'
                : 'Be the first to create a community!'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Community
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {communities.map((community) => (
              <CommunityCard
                key={community._id}
                community={community}
                onJoin={handleJoinCommunity}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Community Modal */}
      {showCreateModal && (
        <CreateCommunityModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCommunityCreated}
        />
      )}
    </MainLayout>
  );
};

export default Communities;
