import { useState } from 'react';
import { X, Users, Lock, Globe } from 'lucide-react';
import { communityService } from '../../services';
import toast from 'react-hot-toast';

const CreateCommunityModal = ({ onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Community name is required');
      return;
    }

    setLoading(true);
    try {
      const community = await communityService.createCommunity(formData);
      toast.success('Community created successfully!');
      if (onCreated) onCreated(community);
      onClose();
    } catch (error) {
      console.error('Error creating community:', error);
      toast.error(error.response?.data?.msg || 'Failed to create community');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Create Community</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Community Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Community Name *
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Mental Health Support"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                maxLength={100}
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What is your community about?"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/1000 characters
            </p>
          </div>

          {/* Privacy Setting */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Privacy
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isPrivate: false })}
                className={`flex-1 p-3 border-2 rounded-lg transition-all ${!formData.isPrivate
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <Globe className={`w-6 h-6 mx-auto mb-2 ${!formData.isPrivate ? 'text-indigo-600' : 'text-gray-400'}`} />
                <p className="font-semibold text-sm text-gray-900">Public</p>
                <p className="text-xs text-gray-500">Anyone can join</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, isPrivate: true })}
                className={`flex-1 p-3 border-2 rounded-lg transition-all ${formData.isPrivate
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <Lock className={`w-6 h-6 mx-auto mb-2 ${formData.isPrivate ? 'text-indigo-600' : 'text-gray-400'}`} />
                <p className="font-semibold text-sm text-gray-900">Private</p>
                <p className="text-xs text-gray-500">Approval required</p>
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Community'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCommunityModal;
