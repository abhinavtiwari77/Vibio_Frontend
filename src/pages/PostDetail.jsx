import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PostCard from '../components/posts/PostCard';
import { postService } from '../services';
import { Loader, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const PostDetail = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const data = await postService.getPost(postId);
                setPost(data.post);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load post");
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        if (postId) {
            fetchPost();
        }
    }, [postId, navigate]);

    const handlePostDeleted = (deletedId) => {
        if (deletedId === post._id) {
            navigate('/');
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex justify-center items-center h-[50vh]">
                    <Loader className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
            </MainLayout>
        );
    }

    if (!post) return null;

    return (
        <MainLayout>
            <div className="max-w-2xl mx-auto py-8 px-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back</span>
                </button>

                <h2 className="text-xl font-bold text-gray-900 mb-6">Post Details</h2>

                <PostCard post={post} onDelete={handlePostDeleted} />
            </div>
        </MainLayout>
    );
};

export default PostDetail;
