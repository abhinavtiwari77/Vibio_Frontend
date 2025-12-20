import { Users, Lock, Globe, Crown, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const CommunityCard = ({ community, onJoin }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const memberCount = community?.members?.length || 0;
  const isPrivate = community?.isPrivate;

  // Check if user is already a member or admin
  const isMember = community?.members?.some(m => {
    const memberId = typeof m === 'string' ? m : (m?._id || m);
    return memberId?.toString() === user?._id?.toString();
  });

  const isAdmin = community?.admins?.some(a => {
    const adminId = typeof a === 'string' ? a : (a?._id || a);
    return adminId?.toString() === user?._id?.toString();
  });

  const isPending = community?.pendingRequests?.some(p => {
    const requestId = typeof p === 'string' ? p : (p?._id || p);
    return requestId?.toString() === user?._id?.toString();
  });

  return (
    <div
      className="card card-hover cursor-pointer group flex flex-col h-full"
      onClick={() => navigate(`/communities/${community.slug || community._id}`)}
    >
      <div className="flex items-start gap-4 flex-1">
        {/* Community Avatar */}
        <div className="w-16 h-16 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
          <span className="text-2xl font-bold text-indigo-600">
            {community?.name?.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Community Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors truncate">
              {community?.name}
            </h3>
            {isPrivate && (
              <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}
          </div>

          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {community?.description || 'No description available'}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
            </div>
            <div className="flex items-center gap-1">
              {isPrivate ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Private</span>
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  <span>Public</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Join Button - Only show if NOT a member and NOT an admin */}
      {!isMember && !isAdmin && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onJoin) onJoin(community);
          }}
          disabled={isPending}
          className="w-full mt-4 btn-primary disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isPending ? 'Request Pending' : isPrivate ? 'Request to Join' : 'Join Community'}
        </button>
      )}
    </div>
  );
};

export default CommunityCard;
