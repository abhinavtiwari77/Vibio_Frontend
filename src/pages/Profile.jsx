import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Calendar, MapPin, Edit, Loader2, X, Heart } from 'lucide-react';
import { formatFullDate } from '../utils/helpers';
import { userService, postService } from '../services';
import PostCard from '../components/posts/PostCard';
import toast from 'react-hot-toast';

const Profile = () => {
  const navigate = useNavigate();
  const { userId } = useParams(); // Get userId from URL
  const { user: currentUser, checkAuth, updateUser } = useAuth(); // Rename context user to currentUser
  const [user, setUser] = useState(null); // Local user state for profile being viewed
  const [requests, setRequests] = useState([]);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  const [followLoading, setFollowLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  const isOwnProfile = !userId || (currentUser && userId === currentUser._id);

  // Follow/Request status helpers
  const isFollowing = currentUser?.following?.includes(user?._id);
  const isRequested = currentUser?.sentRequests?.includes(user?._id);

  useEffect(() => {
    if (isOwnProfile) {
      setUser(currentUser);
    } else if (userId) {
      fetchUserProfile(userId);
    }
  }, [userId, currentUser, isOwnProfile]);

  useEffect(() => {
    if (user?._id) {
      fetchUserPosts();
      if (isOwnProfile) {
        fetchRequests();
      }
    }
  }, [user?._id, isOwnProfile]);

  const fetchUserProfile = async (id) => {
    try {
      const data = await userService.getUserById(id);
      setUser(data.user);
    } catch (error) {
      console.error("Failed to fetch user profile", error);
      toast.error("User not found");
      navigate('/');
    }
  };

  const fetchRequests = async () => {
    try {
      const data = await userService.getFollowRequests();
      setRequests(data.requests);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUserPosts = async () => {
    try {
      setPostsLoading(true);
      const data = await postService.getFeed(1, 20, { author: user._id });
      setPosts(data.posts);
    } catch (error) {
      console.error("Failed to fetch posts", error);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (followLoading || isOwnProfile) return;
    if (!currentUser) {
      toast.error('Please login to follow users');
      return;
    }

    setFollowLoading(true);
    try {
      const res = await userService.toggleFollow(user._id);

      let updatedCurrentUser = { ...currentUser };

      if (res.status === 'requested') {
        toast.success('Follow request sent');
        updatedCurrentUser.sentRequests = [...(currentUser.sentRequests || []), user._id];
      } else if (res.status === 'cancelled') {
        toast.success('Follow request cancelled');
        updatedCurrentUser.sentRequests = (currentUser.sentRequests || []).filter(id => id !== user._id);
      } else if (res.status === 'unfollowed') {
        toast.success('Unfollowed user');
        updatedCurrentUser.following = (currentUser.following || []).filter(id => id !== user._id);
      } else if (res.status === 'followed') {
        toast.success('Following user');
        updatedCurrentUser.following = [...(currentUser.following || []), user._id];
      }

      updateUser(updatedCurrentUser); // Update context

      // If we followed/unfollowed, we might want to update the local 'user' state logic 
      // regarding follower count if we want it real-time, but usually a refresh is fine.
      // For now we just update our relationship status via context.

    } catch (error) {
      console.error('Follow error:', error);
      toast.error(error.response?.data?.msg || 'Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const handlePostAction = (postId, action) => {
    if (action === 'delete') {
      setPosts(posts.filter(p => p._id !== postId));
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


  // Edit Profile Logic
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    location: '',
    phone: ''
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    if (isOwnProfile && currentUser) {
      setEditForm({
        name: currentUser.name || '',
        bio: currentUser.bio || '',
        location: currentUser.location || '',
        phone: currentUser.phone || ''
      });
    }
  }, [isOwnProfile, currentUser]);

  const handleEditClick = () => {
    setEditForm({
      name: currentUser.name || '',
      bio: currentUser.bio || '',
      location: currentUser.location || '',
      phone: currentUser.phone || ''
    });
    setPreviewImage(currentUser.profilePicUrl || null);
    setSelectedFile(null);
    setIsEditing(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', editForm.name);
      formData.append('bio', editForm.bio);
      formData.append('location', editForm.location);
      formData.append('phone', editForm.phone);

      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      const res = await userService.updateMyProfile(formData);

      if (checkAuth) await checkAuth(); // Refresh user context

      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error(error.response?.data?.msg || 'Failed to update profile');
    } finally {
      setUpdateLoading(false);
    }
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="relative">
            {/* Cover Image */}
            <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600"></div>

            {/* Avatar */}
            <div className="absolute -bottom-12 left-6">
              <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg">
                {user?.profilePicUrl ? (
                  <img src={user.profilePicUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Edit or Follow Button */}
            <div className="absolute top-4 right-4">
              {isOwnProfile ? (
                <button
                  onClick={handleEditClick}
                  className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm hover:bg-white transition-colors flex items-center gap-2 text-indigo-700 font-medium"
                >
                  <Edit className="w-4 h-4" />
                  <span className="text-sm">Edit Profile</span>
                </button>
              ) : (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`px - 6 py - 2 rounded - lg shadow - sm transition - all font - medium flex items - center gap - 2 ${isFollowing
                    ? 'bg-white/90 text-gray-700 hover:bg-gray-50'
                    : isRequested
                      ? 'bg-yellow-100/90 text-yellow-700'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    } `}
                >
                  {isFollowing ? 'Following' : isRequested ? 'Requested' : 'Follow'}
                </button>
              )}
            </div>
          </div>

          <div className="mt-16 px-6 pb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{user?.name}</h1>
            <p className="text-gray-600 mb-4">{user?.bio || 'Wellness Enthusiast'}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-500" />
                <span>{user?.email}</span>
              </div>
              {user?.phone && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-500" />
                  <span>{user.phone}</span>
                </div>
              )}
              {user?.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-500" />
                  <span>{user.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>Joined {formatFullDate(user?.createdAt)}</span>
              </div>
            </div>

            {/* Follow Requests (Only visible on Own Profile) */}
            {isOwnProfile && requests.length > 0 && (
              <div className="mt-8 border-t border-gray-100 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Follow Requests</h3>
                <div className="space-y-3">
                  {requests.map((request) => (
                    <div key={request._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                          {request.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{request.name}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">{request.bio || 'No bio'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptRequest(request._id)}
                          className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                          title="Accept"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request._id)}
                          className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          title="Reject"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center gap-12 mt-6 pt-6 border-t border-gray-100">
              <div
                onClick={() => navigate(`/profile/connections?type=followers${!isOwnProfile ? `&userId=${user._id}` : ''}`)}
                className="text-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
              >
                <p className="text-2xl font-bold text-indigo-600">{user?.followers?.length || 0}</p>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Followers</p>
              </div>
              <div
                onClick={() => navigate(`/profile/connections?type=following${!isOwnProfile ? `&userId=${user._id}` : ''}`)}
                className="text-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
              >
                <p className="text-2xl font-bold text-indigo-600">{user?.following?.length || 0}</p>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Following</p>
              </div>
              <div className="text-center p-2 rounded-lg">
                <p className="text-2xl font-bold text-indigo-600">{posts.length}</p>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Posts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Section - Grid Layout */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-bold text-gray-900">{isOwnProfile ? 'Your Posts' : `${user.name.split(' ')[0]} 's Posts`}</h2>
            < span className="text-sm text-gray-500" > {posts.length} posts</span >
          </div >

          {
            postsLoading ? (
              <div className="flex justify-center py-12" >
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
            ) : posts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 md:gap-4">
                {posts.map(post => {
                  const hasMedia = post.media && post.media.length > 0;
                  const hasUrl = post.mediaUrl;
                  const isVideo = hasMedia ? post.media[0].resource_type === 'video' : (hasUrl && hasUrl.match(/\.(mp4|mov|webm)$/i));

                  return (
                    <div
                      key={post._id}
                      onClick={() => setSelectedPost(post)}
                      className="aspect-square bg-gray-100 relative group overflow-hidden cursor-pointer rounded-sm md:rounded-md hover:opacity-95 transition-opacity"
                    >
                      {hasMedia ? (
                        isVideo ? (
                          <video src={post.media[0].url} className="w-full h-full object-cover" />
                        ) : (
                          <img src={post.media[0].url} alt="Post content" className="w-full h-full object-cover" />
                        )
                      ) : hasUrl ? (
                        isVideo ? (
                          <video src={post.mediaUrl} className="w-full h-full object-cover" />
                        ) : (
                          <img src={post.mediaUrl} alt="Post content" className="w-full h-full object-cover" />
                        )
                      ) : (
                        // Text only post placeholder
                        <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-purple-50 p-4 flex items-center justify-center text-center">
                          <p className="text-xs md:text-sm text-gray-800 font-medium line-clamp-5">
                            {post.content}
                          </p>
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-4 text-white font-bold">
                          <div className="flex items-center gap-1">
                            <Heart className="w-5 h-5 fill-current" />
                            <span>{post.likes?.length || 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Multiple Items Indicator */}
                      {hasMedia && post.media.length > 1 && (
                        <div className="absolute top-2 right-2 text-white drop-shadow-md">
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" /></svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-16 px-4">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Edit className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-500 max-w-sm mx-auto">Share your wellness journey, thoughts, or progress with the community.</p>
              </div>
            )}
        </div >
      </div >

      {/* Edit Profile Modal (Only for Own Profile) */}
      {
        isOwnProfile && isEditing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Edit Profile</h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="p-6 overflow-y-auto max-h-[80vh]">
                {/* Image Upload */}
                <div className="flex justify-center mb-8">
                  <div className="relative group cursor-pointer">
                    <div className="w-28 h-28 rounded-full bg-gray-100 overflow-hidden border-4 border-white shadow-md">
                      {previewImage ? (
                        <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-500 text-3xl font-bold">
                          {editForm.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full text-white cursor-pointer">
                      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      rows={3}
                      className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={editForm.location}
                          onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                          className="w-full pl-10 rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="City, Country"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <User className="w-4 h-4" /> {/* Reusing User icon as generic contact icon */}
                        </div>
                        <input
                          type="text"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-full pl-10 rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="+1 234 567 8900"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-70 flex items-center gap-2"
                  >
                    {updateLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* Post Modal */}
      {
        selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
              className="absolute inset-0"
              onClick={() => setSelectedPost(null)}
            ></div>
            <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
              <button
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-white/80 rounded-full hover:bg-white text-gray-500 hover:text-gray-900 transition-all shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
              <PostCard
                post={selectedPost}
                onDelete={(postId) => {
                  handlePostAction(postId, 'delete');
                  setSelectedPost(null);
                }}
              />
            </div>
          </div>
        )
      }
    </MainLayout>
  );
};

export default Profile;
