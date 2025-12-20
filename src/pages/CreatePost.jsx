import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { postService } from '../services';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload,
    X,
    Image as ImageIcon,
    Type,
    Video,
    Loader2,
    FileText
} from 'lucide-react';

const CreatePost = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('media'); // 'media' or 'text'
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [fileType, setFileType] = useState(null); // 'image' or 'video'
    const [title, setTitle] = useState(''); // Note: Backend schema might not have 'title' for simple posts, but we can prepend it or just use it as content header if needed. Assuming 'content' is the main field.
    // Actually, let's concatenate Title + Description into 'content' for now if the backend only has 'content', or check if backend supports title.
    // Looking at postService, it sends 'content'. I will combine them or just use description as content.
    // Let's use Description as the main 'content' and Title as a bolded header if provided.
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        validateAndSetFile(droppedFile);
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        validateAndSetFile(selectedFile);
    };

    const validateAndSetFile = (file) => {
        if (!file) return;

        // Check size (e.g., 250MB)
        if (file.size > 250 * 1024 * 1024) {
            return toast.error('File size exceeds 250MB limit');
        }

        // Check type
        if (file.type.startsWith('image/')) {
            setFileType('image');
        } else if (file.type.startsWith('video/')) {
            setFileType('video');
        } else {
            return toast.error('Please upload an image or video file');
        }

        setFile(file);
        setPreview(URL.createObjectURL(file));
    };

    const clearFile = () => {
        setFile(null);
        setPreview(null);
        setFileType(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async () => {
        if (activeTab === 'media' && !file) {
            return toast.error('Please select a file to upload');
        }
        if (!description.trim()) {
            return toast.error('Please enter a description');
        }

        setIsLoading(true);
        try {
            // Combine title and description for content
            const fullContent = title.trim() ? `${title.trim()}\n\n${description}` : description;

            const mediaFiles = file ? [file] : [];
            await postService.createPost(fullContent, mediaFiles);

            toast.success('Post created successfully!');
            navigate('/');
        } catch (error) {
            console.error(error);
            toast.error('Failed to create post');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainLayout showRightSidebar={false}>
            <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">

                    {/* Tabs */}
                    <div className="flex justify-center mb-8">
                        <div className="bg-white p-1 rounded-2xl shadow-sm border border-gray-100 inline-flex">
                            <button
                                onClick={() => setActiveTab('media')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${activeTab === 'media'
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                <Upload className="w-4 h-4" />
                                Media Post
                            </button>
                            <button
                                onClick={() => setActiveTab('text')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${activeTab === 'text'
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                <FileText className="w-4 h-4" />
                                Simple Post
                            </button>
                        </div>
                    </div>

                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden"
                    >
                        <div className="p-8">

                            {activeTab === 'media' && (
                                <div className="mb-8">
                                    {!file ? (
                                        <div
                                            onDragEnter={handleDragEnter}
                                            onDragLeave={handleDragLeave}
                                            onDragOver={handleDragOver}
                                            onDrop={handleDrop}
                                            className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all ${isDragging
                                                ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                                                : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50/50'
                                                }`}
                                        >
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                className="hidden"
                                                accept="image/*,video/*"
                                                onChange={handleFileSelect}
                                            />
                                            <div className="flex justify-center mb-4">
                                                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                                                    <ImageIcon className="w-8 h-8" />
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                                Drag & drop a short video or image here
                                            </h3>
                                            <p className="text-gray-500 mb-6">or</p>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
                                            >
                                                Choose File
                                            </button>
                                            <p className="mt-4 text-xs text-gray-400 uppercase tracking-wide">
                                                Max size: 250 MB
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="relative rounded-3xl overflow-hidden bg-black aspect-video group">
                                            <button
                                                onClick={clearFile}
                                                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>

                                            {fileType === 'video' ? (
                                                <video
                                                    src={preview}
                                                    controls
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <img
                                                    src={preview}
                                                    alt="Preview"
                                                    className="w-full h-full object-contain"
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2 ml-1">Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Give your post a catchy title"
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2 ml-1">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder={activeTab === 'media' ? "Describe your video or image..." : "What's on your mind?"}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none min-h-[150px] resize-none"
                                    />
                                </div>
                            </div>

                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                            <button
                                onClick={() => navigate('/')}
                                className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading || !description.trim() || (activeTab === 'media' && !file)}
                                className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95 transform duration-100"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publish Post'}
                            </button>
                        </div>
                    </motion.div>

                </div>
            </div>
        </MainLayout>
    );
};

export default CreatePost;
