import { useState, useEffect } from 'react';
import { Send, Trash2, Edit2, X } from 'lucide-react';
import { postService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const CommentSection = ({ postId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const data = await postService.getComments(postId);
      setComments(data.comments || data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const comment = await postService.addComment(postId, newComment);
      setComments([comment, ...comments]);
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      await postService.editComment(commentId, editContent);
      setComments(comments.map(c =>
        c._id === commentId ? { ...c, text: editContent, content: editContent } : c
      ));
      setEditingId(null);
      setEditContent('');
      toast.success('Comment updated');
    } catch (error) {
      console.error('Error editing comment:', error);
      toast.error('Failed to edit comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      await postService.deleteComment(commentId);
      setComments(comments.filter(c => c._id !== commentId));
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  return (
    <div className="p-4">
      {/* Add Comment */}
      <form onSubmit={handleAddComment} className="flex gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold flex-shrink-0">
          {user?.profilePicUrl ? (
            <img src={user.profilePicUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-sm">{user?.name?.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-sm"
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-4 text-gray-500 text-sm">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-4 text-gray-500 text-sm">No comments yet</div>
      ) : (
        <div className={`space-y-3 ${comments.length > 2 ? 'max-h-80 overflow-y-auto pr-2' : ''}`}>
          {comments.map((comment) => (
            <div key={comment._id} className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold flex-shrink-0">
                {comment?.author?.profilePicUrl ? (
                  <img src={comment.author.profilePicUrl} alt={comment.author.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-sm">{comment?.author?.name?.charAt(0).toUpperCase()}</span>
                )}
              </div>

              <div className="flex-1">
                {editingId === comment._id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm"
                    />
                    <button
                      onClick={() => handleEditComment(comment._id)}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditContent('');
                      }}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-2xl px-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm text-gray-900">
                        {comment?.author?.name || 'Unknown User'}
                      </p>
                      {comment?.author?._id === user?._id && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingId(comment._id);
                              setEditContent(comment.text || comment.content);
                            }}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Edit2 className="w-3 h-3 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Trash2 className="w-3 h-3 text-red-600" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-700 text-sm">{comment.text || comment.content}</p>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1 ml-4">{formatDate(comment.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
