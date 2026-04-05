import { useState, useEffect, useRef, useCallback } from 'react';
import MainLayout from '../components/layout/MainLayout';
import CreatePost from '../components/posts/CreatePost';
import PostCard from '../components/posts/PostCard';
import { Loader, Heart } from 'lucide-react';
import { postService } from '../services';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();

  // Load from cache on mount
  useEffect(() => {
    const cachedPosts = localStorage.getItem('feed_cache');
    if (cachedPosts) {
      setPosts(JSON.parse(cachedPosts));
    }
    fetchPosts(1, true); // Fetch fresh data for page 1
  }, []);

  const lastPostElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  useEffect(() => {
    if (page > 1) {
      fetchPosts(page);
    }
  }, [page]);

  const fetchPosts = async (pageNum, isRefresh = false) => {
    setLoading(true);
    try {
      const data = await postService.getFeed(pageNum, 10);
      const newPosts = data.posts || [];

      setPosts(prev => {
        let updated;
        if (isRefresh) {
          updated = newPosts;
        } else {
          // Filter duplicates just in case
          const existingIds = new Set(prev.map(p => p._id));
          const uniqueNew = newPosts.filter(p => !existingIds.has(p._id));
          updated = [...prev, ...uniqueNew];
        }

        // Cache first page
        if (pageNum === 1) {
          localStorage.setItem('feed_cache', JSON.stringify(updated.slice(0, 10)));
        }
        return updated;
      });

      setHasMore(newPosts.length === 10); // Assuming limit is 10
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };



  const handlePostCreated = () => {
    fetchPosts(1, true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePostDeleted = (postId) => {
    setPosts(prev => {
      const updated = prev.filter(post => post._id !== postId);
      localStorage.setItem('feed_cache', JSON.stringify(updated.slice(0, 10)));
      return updated;
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl px-1 py-2 sm:px-3">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Header Section */}
          <motion.div variants={itemVariants} className="mb-6 vibio-panel p-6 sm:p-7 bg-gradient-to-r from-white to-blue-50/70">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-slate-600 mt-2">
              Your people are sharing ideas, photos, stories, and moments. Jump in and create something meaningful.
            </p>
          </motion.div>

          {/* Create Post */}
          {showCreatePost && (
            <motion.div variants={itemVariants} className="mb-6">
              <CreatePost onPostCreated={handlePostCreated} />
            </motion.div>
          )}

          {/* Feed Header */}
          <motion.div variants={itemVariants} className="flex items-center justify-between mb-5 px-1">
            <h2 className="text-xl font-bold text-slate-900">Latest From Your Network</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreatePost(!showCreatePost)}
                className="vibio-btn-ghost"
              >
                {showCreatePost ? 'Hide Create Post' : 'Create Post'}
              </button>
            </div>
          </motion.div>

          {/* Posts Feed */}
          <motion.div variants={itemVariants} className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16 vibio-panel border-dashed bg-gradient-to-r from-white to-cyan-50/60">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">No posts yet</h3>
                <p className="text-slate-600 max-w-sm mx-auto">
                  Your feed is ready. Share your first post or connect with more people to start the stream.
                </p>
              </div>
            ) : (
              posts.map((post, index) => {
                if (posts.length === index + 1) {
                  return (
                    <div ref={lastPostElementRef} key={post._id}>
                      <PostCard
                        post={post}
                        onDelete={handlePostDeleted}
                      />
                    </div>
                  );
                } else {
                  return (
                    <PostCard
                      key={post._id}
                      post={post}
                      onDelete={handlePostDeleted}
                    />
                  );
                }
              })
            )}
            {loading && posts.length > 0 && (
              <div className="flex items-center justify-center py-4">
                <Loader className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default Home;

