import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services';
import PostCard from '../components/posts/PostCard';
import { Loader2, Heart } from 'lucide-react';

const Favorites = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        try {
            const data = await userService.getFavorites();
            setPosts(data.favorites);
        } catch (error) {
            console.error("Failed to fetch favorites", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePostAction = (postId, action) => {
        // If un-favorited or deleted, remove from view
        // Note: PostCard handles the API call for delete/toggle-like. 
        // For favorites, we might want to refresh or filter out if the user un-favorites it.
        // But simply filtering locally on delete is good.
        if (action === 'delete') {
            setPosts(posts.filter(p => p._id !== postId));
        }
    };

    return (
        <MainLayout>
            <div className="max-w-2xl mx-auto py-8 px-4">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                        <Heart className="w-6 h-6 fill-current" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Favorites</h1>
                        <p className="text-gray-500 text-sm">Posts you have saved for later</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                ) : posts.length > 0 ? (
                    <div className="space-y-6">
                        {posts.map(post => (
                            <PostCard key={post._id} post={post} onDelete={(id) => handlePostAction(id, 'delete')} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-16 px-4">
                        <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Heart className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No favorites yet</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            Posts you favorite will appear here. Click the bookmark/heart icon on any post to save it.
                        </p>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default Favorites;
