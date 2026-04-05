import { useState, useRef, useEffect } from 'react';
import { X, Image as ImageIcon, Video, Smile, SendHorizontal } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { postService } from '../../services';
import toast from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';
import { useClickOutside } from '../../hooks';

const CreatePost = ({ onPostCreated, onClose }) => {
  const RATIO_OPTIONS = ['original', '1:1', '4:5', '3:2', '16:9', '9:16'];
  const SIZE_OPTIONS = [
    { label: 'Original Size', value: 'original' },
    { label: 'Small (720)', value: '720' },
    { label: 'Medium (1080)', value: '1080' },
    { label: 'Large (1440)', value: '1440' }
  ];

  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [mediaEdits, setMediaEdits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const emojiRef = useClickOutside(() => setShowEmojiPicker(false));
  const videoInputRef = useRef(null);

  const revokeObjectUrlIfNeeded = (url) => {
    if (typeof url === 'string' && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  };

  useEffect(() => {
    return () => {
      mediaPreviews.forEach((preview) => revokeObjectUrlIfNeeded(preview.url));
    };
  }, [mediaPreviews]);

  const getMediaMeta = (file) => new Promise((resolve) => {
    const url = URL.createObjectURL(file);

    if (file.type.startsWith('image/')) {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width && img.height ? `${img.width}:${img.height}` : 'original';
        URL.revokeObjectURL(url);
        resolve({ ratio });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ ratio: 'original' });
      };
      img.src = url;
      return;
    }

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const ratio = video.videoWidth && video.videoHeight
        ? `${video.videoWidth}:${video.videoHeight}`
        : 'original';
      URL.revokeObjectURL(url);
      resolve({ ratio });
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ ratio: 'original' });
    };
    video.src = url;
  });

  const handleFileSelect = async (e) => {
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

    if (!validFiles.length) return;

    const meta = await Promise.all(validFiles.map((file) => getMediaMeta(file)));

    setMediaFiles(prev => [...prev, ...validFiles]);
    setMediaEdits(prev => [
      ...prev,
      ...meta.map((m, idx) => ({
        ratio: 'original',
        originalRatio: m.ratio,
        size: 'original',
        fileName: validFiles[idx]?.name || '',
        fileType: validFiles[idx]?.type || '',
        fileSize: validFiles[idx]?.size || 0
      }))
    ]);

    // Build previews in deterministic order so index maps correctly to mediaEdits/mediaFiles
    const orderedPreviews = validFiles.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : 'video',
      name: file.name
    }));
    setMediaPreviews((prev) => [...prev, ...orderedPreviews]);

    // Reset inputs
    e.target.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const removeMedia = (index) => {
    const preview = mediaPreviews[index];
    if (preview?.url) revokeObjectUrlIfNeeded(preview.url);

    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
    setMediaPreviews(mediaPreviews.filter((_, i) => i !== index));
    setMediaEdits(mediaEdits.filter((_, i) => i !== index));
  };

  const canPost = Boolean(content.trim() || mediaFiles.length > 0);

  const updateMediaEdit = (index, field, value) => {
    setMediaEdits((prev) => prev.map((edit, i) => (
      i === index ? { ...edit, [field]: value } : edit
    )));
  };

  const getPreviewAspect = (index) => {
    const edit = mediaEdits[index];
    if (!edit) return '16 / 9';
    const selected = edit.ratio === 'original' ? edit.originalRatio : edit.ratio;
    return selected && selected.includes(':') ? selected.replace(':', ' / ') : '16 / 9';
  };

  const getPreviewFitClass = (index) => {
    return 'object-contain';
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
      await postService.createPost(content, mediaFiles, mediaEdits);
      toast.success('Post created successfully!');
      mediaPreviews.forEach((preview) => revokeObjectUrlIfNeeded(preview.url));
      setContent('');
      setMediaFiles([]);
      setMediaPreviews([]);
      setMediaEdits([]);
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
    <div className="vibio-panel p-5 sm:p-6 bg-gradient-to-r from-white to-blue-50/40">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-md shadow-blue-500/30">
          {user?.profilePicUrl ? (
            <img src={user.profilePicUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span>{user?.name?.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-slate-900">{user?.name}</p>
          <p className="text-sm text-slate-600">Drop a thought, photo, video, or mood update</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="vibio-input block w-full !min-h-[190px] rounded-2xl resize-none !p-4 placeholder:text-slate-500 leading-7 transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(43,89,255,0.14),0_12px_28px_rgba(43,89,255,0.08)]"
        />
        <div className="mt-2 flex justify-end">
          <span className="text-xs text-slate-400">{content.length}/500</span>
        </div>

        {/* Media Previews */}
        {mediaPreviews.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            {mediaPreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <div
                  className="w-full rounded-2xl overflow-hidden bg-slate-100"
                  style={{ aspectRatio: getPreviewAspect(index) }}
                >
                  {preview.type === 'image' ? (
                    <img
                      src={preview.url}
                      alt={`Preview ${index}`}
                      className={`w-full h-full ${getPreviewFitClass(index)}`}
                    />
                  ) : (
                    <video
                      src={preview.url}
                      className={`w-full h-full ${getPreviewFitClass(index)}`}
                      controls
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <select
                    value={mediaEdits[index]?.ratio || 'original'}
                    onChange={(evt) => updateMediaEdit(index, 'ratio', evt.target.value)}
                    className="vibio-input !py-2 !px-2 text-xs"
                  >
                    {RATIO_OPTIONS.map((ratio) => (
                      <option key={ratio} value={ratio}>
                        {ratio === 'original'
                          ? `Original (${mediaEdits[index]?.originalRatio || 'auto'})`
                          : ratio}
                      </option>
                    ))}
                  </select>

                  <select
                    value={mediaEdits[index]?.size || 'original'}
                    onChange={(evt) => updateMediaEdit(index, 'size', evt.target.value)}
                    className="vibio-input !py-2 !px-2 text-xs"
                  >
                    {SIZE_OPTIONS.map((size) => (
                      <option key={size.value} value={size.value}>{size.label}</option>
                    ))}
                  </select>
                </div>

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
        <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-blue-100">
          <div className="flex items-center gap-2 relative">
            {/* Image Input */}
            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border border-blue-100 bg-white hover:bg-blue-50 rounded-xl transition-all active:scale-95" title="Add Image">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={loading}
              />
              <ImageIcon className="w-4 h-4 text-slate-600 transition-colors" />
              <span className="hidden sm:inline text-xs font-medium text-slate-600">Photo</span>
            </label>

            {/* Video Input */}
            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border border-blue-100 bg-white hover:bg-blue-50 rounded-xl transition-all active:scale-95" title="Add Video">
              <input
                ref={videoInputRef}
                type="file"
                multiple
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={loading}
              />
              <Video className="w-4 h-4 text-slate-600 transition-colors" />
              <span className="hidden sm:inline text-xs font-medium text-slate-600">Video</span>
            </label>

            {/* Emoji Picker */}
            <div className="relative" ref={emojiRef}>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border transition-all active:scale-95 ${showEmojiPicker ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-transparent shadow-md shadow-blue-500/25' : 'border-blue-100 bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-700'}`}
                disabled={loading}
                title="Add Emoji"
              >
                <Smile className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-medium">Emoji</span>
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
            disabled={loading || !canPost}
            className={`min-w-28 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${loading || !canPost
              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/25 hover:brightness-105 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300'
              }`}
          >
            <SendHorizontal className="w-4 h-4" />
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
