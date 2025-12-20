import { useState, useRef } from 'react';
import { X, Image as ImageIcon, Video, Smile } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { postService } from '../../services';
import toast from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';
import { useClickOutside } from '../../hooks';

const CreatePost = ({ onPostCreated, onClose }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const emojiRef = useClickOutside(() => setShowEmojiPicker(false));
  const videoInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + mediaFiles.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }

    // Validate file types and size
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB

      if (!isImage && !isVideo) {
        toast.error(`${file.name} is not a valid image or video`);
        return false;
      }
      if (!isValidSize) {
        toast.error(`${file.name} exceeds 50MB limit`);
        return false;
      }
      return true;
    });

    setMediaFiles(prev => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreviews(prev => [...prev, {
          url: e.target.result,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });

    // Reset inputs
    e.target.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const removeMedia = (index) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
    setMediaPreviews(mediaPreviews.filter((_, i) => i !== index));
  };

  const onEmojiClick = (emojiData) => {
    setContent(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim() && mediaFiles.length === 0) {
      toast.error('Please add some content or media');
      return;
    }

    setLoading(true);
    try {
      await postService.createPost(content, mediaFiles);
      toast.success('Post created successfully!');
      setContent('');
      setMediaFiles([]);
      setMediaPreviews([]);
      if (onPostCreated) onPostCreated();
      if (onClose) onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error(error.response?.data?.msg || error.response?.data?.error || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold flex-shrink-0">
          {user?.profilePicUrl ? (
            <img src={user.profilePicUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span>{user?.name?.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{user?.name}</p>
          <p className="text-sm text-gray-500">Share your wellness journey</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full min-h-[120px] p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none placeholder:text-gray-400"
        />

        {/* Media Previews */}
        {mediaPreviews.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            {mediaPreviews.map((preview, index) => (
              <div key={index} className="relative group">
                {preview.type === 'image' ? (
                  <img
                    src={preview.url}
                    alt={`Preview ${index}`}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                ) : (
                  <video
                    src={preview.url}
                    className="w-full h-40 object-cover rounded-lg"
                    controls
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(index)}
                  className="absolute top-2 right-2 bg-black/75 hover:bg-black text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 relative">
            {/* Image Input */}
            <label className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Add Image">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={loading}
              />
              <ImageIcon className="w-5 h-5 text-gray-500 hover:text-indigo-600 transition-colors" />
            </label>

            {/* Video Input */}
            <label className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Add Video">
              <input
                ref={videoInputRef}
                type="file"
                multiple
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={loading}
              />
              <Video className="w-5 h-5 text-gray-500 hover:text-indigo-600 transition-colors" />
            </label>

            {/* Emoji Picker */}
            <div className="relative" ref={emojiRef}>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-2 rounded-lg transition-colors ${showEmojiPicker ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-100 text-gray-500 hover:text-indigo-600'}`}
                disabled={loading}
                title="Add Emoji"
              >
                <Smile className="w-5 h-5" />
              </button>

              {showEmojiPicker && (
                <div className="absolute z-50 mt-2">
                  <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={400} />
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || (!content.trim() && mediaFiles.length === 0)}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
