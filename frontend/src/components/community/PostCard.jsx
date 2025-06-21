import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/authContext';
import { toggleLike, addReply, deletePost } from '../../services/communityService';
import { HeartIcon, ChatBubbleLeftIcon, TrashIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';

const PostCard = ({ post, onPostUpdated, onPostDeleted }) => {
  const { user } = useContext(AuthContext);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(false);

  const isLiked = user && post.likes.includes(user.id);
  const canDelete = user && (user.id === post.user._id || user.isAdmin);

  const handleLike = async () => {
    if (!user) {
      alert('Please log in to like posts');
      return;
    }

    try {
      const response = await toggleLike(post._id);
      if (response.success) {
        onPostUpdated(response.post);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to reply');
      return;
    }

    if (!replyContent.trim()) {
      alert('Please write a reply');
      return;
    }

    try {
      setLoading(true);
      const response = await addReply(post._id, { content: replyContent.trim() });
      if (response.success) {
        onPostUpdated(response.post);
        setReplyContent('');
        setShowReplyBox(false);
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      alert('Failed to add reply');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) return;

    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const response = await deletePost(post._id);
        if (response.success) {
          onPostDeleted(post._id);
        }
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post');
      }
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - postTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="p-6">
        {/* Post header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {post.user.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900">{post.user.username}</span>
                <span className="text-gray-500 text-sm">•</span>
                <span className="text-gray-500 text-sm">{formatTime(post.createdAt)}</span>
              </div>
              {post.location && (
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <MapPinIcon className="h-4 w-4" />
                  <span>{post.location}</span>
                </div>
              )}
            </div>
          </div>
          
          {canDelete && (
            <button
              onClick={handleDelete}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Post content */}
        <div className="mb-4">
          <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
          
          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="mt-2">
              {post.hashtags.map((tag, index) => (
                <span key={index} className="text-blue-600 text-sm mr-2">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Post image */}
        {post.image && (
          <div className="mb-4">
            <img
              src={`http://localhost:5000/api/community/images/${post.image}`}
              alt="Post attachment"
              className="w-full max-h-96 object-cover rounded-lg border"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Post actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-6">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 ${
                isLiked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
              } transition-colors`}
            >
              {isLiked ? (
                <HeartSolid className="h-5 w-5" />
              ) : (
                <HeartIcon className="h-5 w-5" />
              )}
              <span className="text-sm">{post.likes.length}</span>
            </button>

            <button
              onClick={() => setShowReplyBox(!showReplyBox)}
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors"
            >
              <ChatBubbleLeftIcon className="h-5 w-5" />
              <span className="text-sm">{post.replies.length}</span>
            </button>
          </div>
        </div>

        {/* Reply box */}
        {showReplyBox && user && (
          <form onSubmit={handleReply} className="mt-4 border-t border-gray-100 pt-4">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-semibold">
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="w-full border border-gray-300 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="2"
                  maxLength="300"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">{replyContent.length}/300</span>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowReplyBox(false);
                        setReplyContent('');
                      }}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !replyContent.trim()}
                      className="px-4 py-1 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Replying...' : 'Reply'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Replies */}
        {post.replies && post.replies.length > 0 && (
          <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
            {post.replies.map((reply) => (
              <div key={reply._id} className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-semibold">
                    {reply.user.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-sm text-gray-900">
                        {reply.user.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(reply.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900">{reply.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCard; 