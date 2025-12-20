import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Trash2, Edit, UserPlus, UserCheck, UserMinus } from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import { postService, userService } from '../../services';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import CommentSection from './CommentSection';
import { useClickOutside } from '../../hooks';

const PostCard = ({ post: initialPost, onDelete }) => {
  const { user, updateUser } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const isFollowing = user?.following?.includes(post?.author?._id);
  const isRequested = user?.sentRequests?.includes(post?.author?._id);

  const menuRef = useClickOutside(() => setShowMenu(false));

  const isLiked = post?.likes?.some(id => String(id) === String(user?._id));
  const isOwner = user?._id && post?.author?._id && String(post.author._id) === String(user._id);

  // Check initial favorite status if user.favorites is available in context/props
  // Since user.favorites isn't always fresh in context props, we might rely on toggle return or fetch
  useEffect(() => {
    if (user?.favorites && post?._id) {
      setIsFavorited(user.favorites.includes(post._id));
    }
  }, [user, post?._id]);

  const handleLike = async () => {
    if (likeLoading) return;

    setLikeLoading(true);
    try {
      const response = await postService.toggleLike(post._id);

      // Update the post with the response data
      setPost(prev => ({
        ...prev,
        likesCount: response.likesCount,
        likes: response.liked
          ? [...(prev.likes || []), user._id]
          : (prev.likes || []).filter(id => String(id) !== String(user._id))
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to like post');
    } finally {
      setLikeLoading(false);
    }
  };

  const handleFavorite = async () => {
    try {
      const res = await userService.toggleFavorite(post._id);
      setIsFavorited(res.isFavorited);
      toast.success(res.isFavorited ? 'Added to favorites' : 'Removed from favorites');
      if (user) {
        updateUser({ favorites: res.favorites });
      }
    } catch (error) {
      console.error('Favorite error', error);
      toast.error('Failed to update favorites');
    }
  };

  const handleFollow = async () => {
    if (followLoading) return;
    if (!user) {
      toast.error('Please login to follow users');
      return;
    }

    setFollowLoading(true);
    try {
      const res = await userService.toggleFollow(post.author._id);

      let updatedUser = { ...user };

      if (res.status === 'requested') {
        toast.success('Follow request sent');
        updatedUser.sentRequests = [...(user.sentRequests || []), post.author._id];
      } else if (res.status === 'cancelled') {
        toast.success('Follow request cancelled');
        updatedUser.sentRequests = (user.sentRequests || []).filter(id => id !== post.author._id);
      } else if (res.status === 'unfollowed') {
        toast.success('Unfollowed user');
        updatedUser.following = (user.following || []).filter(id => id !== post.author._id);
      } else if (res.status === 'followed') { // Fallback if backend changes to direct follow
        toast.success('Following user');
        updatedUser.following = [...(user.following || []), post.author._id];
      }

      updateUser(updatedUser);
    } catch (error) {
      console.error('Follow error:', error);
      toast.error(error.response?.data?.msg || 'Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await postService.deletePost(post._id);
      toast.success('Post deleted successfully');
      if (onDelete) onDelete(post._id);
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
    >
      {/* Post Header */}
      <div className="p-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100 flex-shrink-0">
            {post?.author?.profilePicUrl ? (
              <img src={post.author.profilePicUrl} alt={post.author.name} className="w-full h-full rounded-full object-cover" loading="lazy" />
            ) : (
              <span>{post?.author?.name?.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-base leading-tight">{post?.author?.name || 'Unknown User'}</h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{formatDate(post?.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isOwner && user && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleFollow}
              disabled={followLoading}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${isFollowing
                ? 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                : isRequested
                  ? 'bg-yellow-50 text-yellow-600 border-yellow-200'
                  : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100'
                }`}
            >
              {isFollowing ? (
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Following</span>
                </div>
              ) : isRequested ? (
                <div className="flex items-center gap-1.5">
                  <UserMinus className="w-3.5 h-3.5" />
                  <span>Requested</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Follow</span>
                </div>
              )}
            </motion.button>
          )}

          {isOwner && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-10 overflow-hidden"
                >
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Post</span>
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{post?.content}</p>
      </div>

      {/* Post Media */}
      {post?.media && post.media.length > 0 && (
        <div className={`mt-2 ${post.media.length === 1 ? '' : 'grid grid-cols-2 gap-0.5'}`}>
          {post.media.map((item, index) => {
            const isVideo = item.resource_type === 'video' || item.type === 'video';
            return (
              <div key={index} className={`relative bg-gray-50 ${post.media.length === 1 ? 'aspect-video' : 'aspect-square'}`}>
                {isVideo ? (
                  <video
                    src={item.url}
                    controls
                    className="w-full h-full object-cover"
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={item.url}
                    alt={`Post media ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                    loading="lazy"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Post Stats */}
      <div className="px-4 py-3 flex items-center justify-between text-xs font-medium text-gray-500 border-b border-gray-50">
        <span className="flex items-center gap-1 hover:text-indigo-600 transition-colors cursor-pointer">
          {post?.likesCount || post?.likes?.length || 0} Likes
        </span>
        <span className="flex items-center gap-1 hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => setShowComments(!showComments)}>
          {post?.commentsCount || 0} Comments
        </span>
      </div>

      {/* Post Actions */}
      <div className="px-2 py-1.5 flex items-center justify-between">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleLike}
          disabled={likeLoading}
          className={`flex-1 flex items-center justify-center gap-2 px-2 py-2.5 rounded-lg transition-all ${isLiked
            ? 'text-red-500'
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          <span className="text-sm font-medium hidden sm:block">Like</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center gap-2 px-2 py-2.5 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:block">Comment</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          className="flex-1 flex items-center justify-center gap-2 px-2 py-2.5 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all"
        >
          <Share2 className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:block">Share</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleFavorite}
          className={`flex-1 flex items-center justify-center gap-2 px-2 py-2.5 rounded-lg transition-all ${isFavorited ? 'text-indigo-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
        >
          <Bookmark className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
          <span className="text-sm font-medium hidden sm:block">Save</span>
        </motion.button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-50 bg-gray-50/30"
          >
            <CommentSection postId={post._id} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PostCard;
