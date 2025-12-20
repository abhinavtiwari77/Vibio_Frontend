import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import CommunityChat from '../components/community/CommunityChat';
import {
  Users,
  Settings,
  UserPlus,
  Lock,
  Globe,
  Crown,
  LogOut,
  MoreHorizontal,
  Check,
  X as XIcon,
  MessageCircle,
  UserPlus as FollowIcon,
  UserCheck,
  UserMinus
} from 'lucide-react';
import { communityService, userService } from '../services';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useClickOutside } from '../hooks';

const CommunityDetail = () => {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat'); // chat, members, pending
  const [showMenu, setShowMenu] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const menuRef = useClickOutside(() => setShowMenu(false));

  useEffect(() => {
    fetchCommunity();
  }, [identifier]);

  const fetchCommunity = async () => {
    setLoading(true);
    try {
      const data = await communityService.getCommunity(identifier);
      const communityData = data.community || data;
      console.log('Community data:', communityData);
      console.log('Current user ID:', user?._id);
      console.log('Members:', communityData?.members);
      console.log('Admins:', communityData?.admins);
      setCommunity(communityData);
    } catch (error) {
      console.error('Error fetching community:', error);
      toast.error('Failed to load community');
      navigate('/communities');
    } finally {
      setLoading(false);
    }
  };

  // Check membership - handle both ObjectId strings and populated objects
  const isMember = community?.members?.some(m => {
    const memberId = typeof m === 'string' ? m : (m?._id || m);
    const userId = user?._id;
    const match = memberId?.toString() === userId?.toString();
    if (match) console.log('User is a member');
    return match;
  });

  const isAdmin = community?.admins?.some(a => {
    const adminId = typeof a === 'string' ? a : (a?._id || a);
    const userId = user?._id;
    const match = adminId?.toString() === userId?.toString();
    if (match) console.log('User is an admin');
    return match;
  });

  const isPending = community?.pendingRequests?.some(r => {
    const requestId = typeof r === 'string' ? r : (r?._id || r);
    const userId = user?._id;
    return requestId?.toString() === userId?.toString();
  });

  console.log('Membership status:', { isMember, isAdmin, isPending });

  const handleJoinLeave = async () => {
    setActionLoading(true);
    try {
      if (isMember) {
        await communityService.leaveCommunity(community._id);
        toast.success('Left community');
      } else {
        await communityService.joinCommunity(community._id);
        toast.success(community.isPrivate ? 'Join request sent' : 'Joined community');
      }
      fetchCommunity();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.msg || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveRequest = async (userId) => {
    try {
      await communityService.approveRequest(community._id, userId);
      toast.success('Request approved');
      fetchCommunity();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to approve request');
    }
  };

  const handleRejectRequest = async (userId) => {
    try {
      await communityService.rejectRequest(community._id, userId);
      toast.success('Request rejected');
      fetchCommunity();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to reject request');
    }
  };

  const handleFollowUser = async (userId) => {
    try {
      const res = await userService.toggleFollow(userId);

      let updatedUser = { ...user };

      if (res.status === 'requested') {
        toast.success('Follow request sent');
        updatedUser.sentRequests = [...(user.sentRequests || []), userId];
      } else if (res.status === 'cancelled') {
        toast.success('Follow request cancelled');
        updatedUser.sentRequests = (user.sentRequests || []).filter(id => id !== userId);
      } else if (res.status === 'unfollowed') {
        toast.success('Unfollowed user');
        updatedUser.following = (user.following || []).filter(id => id !== userId);
      } else if (res.status === 'followed') {
        toast.success('Following user');
        updatedUser.following = [...(user.following || []), userId];
      }

      updateUser(updatedUser);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update follow status');
    }
  };

  const handleDeleteCommunity = async () => {
    if (!window.confirm('Are you sure you want to delete this community? This action cannot be undone.')) return;
    setActionLoading(true);
    try {
      await communityService.deleteCommunity(community._id);
      toast.success('Community deleted');
      navigate('/communities');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete community');
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await communityService.removeMember(community._id, memberId);
      toast.success('Member removed');
      fetchCommunity();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to remove member');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading community...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout showRightSidebar={false}>
      <div className="max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
        {/* Community Header - Compact */}
        <div className="bg-white border-b border-gray-100 px-6 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-white">
                  {community?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900">{community?.name}</h1>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${community?.isPrivate ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                    {community?.isPrivate ? 'Private' : 'Public'}
                  </span>
                </div>
                <p className="text-sm text-slate-500 line-clamp-1 max-w-md">{community?.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Quick Stats */}
              <div className="hidden md:flex items-center gap-4 mr-4 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{community?.members?.length || 0} members</span>
                </div>
              </div>

              {!isMember && !isAdmin ? (
                <button
                  onClick={handleJoinLeave}
                  disabled={actionLoading || isPending}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Request Pending' : community?.isPrivate ? 'Request' : 'Join'}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Settings className="w-5 h-5" />
                    </button>
                  )}
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    {showMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                        <button
                          onClick={handleJoinLeave}
                          disabled={actionLoading}
                          className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Leave Community</span>
                        </button>
                        {isAdmin && (
                          <button
                            onClick={handleDeleteCommunity}
                            disabled={actionLoading}
                            className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                          >
                            <XIcon className="w-4 h-4" />
                            <span>Delete Community</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Compact Tabs */}
          <div className="flex gap-6 mt-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('chat')}
              className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors ${activeTab === 'chat'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors ${activeTab === 'members'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
              Members
            </button>
            {isAdmin && community?.pendingRequests?.length > 0 && (
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors ${activeTab === 'pending'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
              >
                Requests ({community.pendingRequests.length})
              </button>
            )}
          </div>
        </div>

        {/* Content Area - Fills remaining height */}
        <div className="flex-1 overflow-hidden bg-slate-50 relative">
          <div className="absolute inset-0 p-4 overflow-y-auto">
            {activeTab === 'chat' && (
              <div className="w-full h-full flex flex-col">
                {(isMember || isAdmin) ? (
                  <CommunityChat
                    communityId={community._id}
                    communityName={community.name}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="card text-center py-12 max-w-md mx-auto">
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                      <p className="text-slate-600 mb-2">Join the community to chat</p>
                      <p className="text-sm text-slate-500 mb-6">
                        Connect with other members in real-time
                      </p>
                      <button
                        onClick={handleJoinLeave}
                        disabled={actionLoading || isPending}
                        className="btn-primary"
                      >
                        {isPending ? 'Request Pending' : community?.isPrivate ? 'Request to Join' : 'Join Community'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'members' && (
              <div className="max-w-3xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {community?.members?.map((member) => {
                    const memberIsAdmin = community?.admins?.some(a => a._id === member._id || a === member._id);
                    const isCurrentUser = member._id === user?._id || member === user?._id;
                    const memberId = member._id || member;

                    const isFollowing = user?.following?.includes(memberId);
                    const isRequested = user?.sentRequests?.includes(memberId);

                    return (
                      <div key={memberId} className="card flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold flex-shrink-0 text-sm">
                            {member?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate text-sm">
                              {member?.name || 'Unknown User'}
                              {memberIsAdmin && <Crown className="w-3 h-3 inline ml-1 text-yellow-500" />}
                            </p>
                            <p className="text-xs text-slate-500">
                              {memberIsAdmin ? 'Admin' : 'Member'}
                            </p>
                          </div>
                        </div>
                        {!isCurrentUser && (
                          <div className="flex gap-2">
                            {isAdmin && (
                              <button
                                onClick={() => handleRemoveMember(memberId)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove Member"
                              >
                                <LogOut className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleFollowUser(memberId)}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${isFollowing
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : isRequested
                                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                                }`}
                              title={isFollowing ? "Unfollow" : isRequested ? "Request Sent" : "Follow"}
                            >
                              {isFollowing ? (
                                <>
                                  <UserCheck className="w-3 h-3" />
                                  Following
                                </>
                              ) : isRequested ? (
                                <>
                                  <UserMinus className="w-3 h-3" />
                                  Requested
                                </>
                              ) : (
                                <>
                                  <FollowIcon className="w-3 h-3" />
                                  Follow
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'pending' && isAdmin && (
              <div className="max-w-2xl mx-auto space-y-4">
                {community?.pendingRequests?.map((request) => (
                  <div key={request._id || request} className="card flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                        {request?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{request?.name || 'Unknown User'}</p>
                        <p className="text-xs text-slate-500">Wants to join</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveRequest(request._id || request)}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request._id || request)}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs font-medium"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};


export default CommunityDetail;
