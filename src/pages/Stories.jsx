import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import axios from 'axios';
import { Heart, Send, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Stories = () => {
    const [stories, setStories] = useState([]);
    const [newStory, setNewStory] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchStories = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:3000/api/stories', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStories(res.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStories();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newStory.trim()) return;

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:3000/api/stories', { content: newStory }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStories([res.data, ...stories]);
            setNewStory('');
            toast.success('Story posted anonymously!');
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || 'Failed to post story. Please try again.';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLike = async (id) => {
        try {
            // Optimistic update
            const token = localStorage.getItem('token');
            setStories(prev => prev.map(story => {
                if (story._id === id) {
                    // This creates a temporary optimistic update; proper toggle logic requires knowing if user liked it.
                    // Assuming for now simple increment for visual feedback or just wait for server.
                    return story;
                }
                return story;
            }));

            const res = await axios.put(`http://localhost:3000/api/stories/${id}/like`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setStories(prev => prev.map(story =>
                story._id === id ? { ...story, likes: res.data } : story
            ));

        } catch (error) {
            console.error(error);
            toast.error('Failed to like story');
        }
    };

    return (
        <MainLayout>
            <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">

                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-indigo-600" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
                        Stories of People
                    </h1>
                    <p className="text-gray-500 max-w-lg mx-auto">
                        We believe that by sharing our experiences, we can help others feel less alone.
                        Share your story anonymously and inspire others.
                    </p>
                </div>

                {/* Compose Story */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <textarea
                            value={newStory}
                            onChange={(e) => setNewStory(e.target.value)}
                            placeholder="Share your story anonymously..."
                            maxLength={1000}
                            className="w-full bg-gray-50 border-0 rounded-xl p-4 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none min-h-[120px]"
                        />
                        <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>{newStory.length}/1000</span>
                            <button
                                type="submit"
                                disabled={!newStory.trim() || isSubmitting}
                                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm hover:shadow-md active:scale-95 transform duration-100"
                            >
                                {isSubmitting ? 'Posting...' : <>Post Anonymously <Send className="w-4 h-4" /></>}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Stories Feed */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="text-center text-gray-500 py-12">
                            Loading stories...
                        </div>
                    ) : (
                        <AnimatePresence>
                            {stories.map(story => (
                                <motion.div
                                    key={story._id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                            ?
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Anonymous</h3>
                                            <p className="text-xs text-gray-500">{new Date(story.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-5 text-lg">
                                        {story.content}
                                    </p>

                                    <div className="border-t border-gray-50 pt-4 flex items-center gap-2">
                                        <button
                                            onClick={() => handleLike(story._id)}
                                            className="group flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors"
                                        >
                                            <div className="p-2 rounded-full bg-gray-50 group-hover:bg-red-50 transition-colors">
                                                <Heart className={`w-5 h-5 ${story.likes && story.likes.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                                            </div>
                                            <span className="font-medium">{story.likes ? story.likes.length : story.likesCount || 0} Likes</span>
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

export default Stories;
