import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/community';

// Create axios instance with interceptors for auth
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('Making request to:', config.url, 'with token:', token ? 'present' : 'missing');
  return config;
});

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('Unauthorized - redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Get all posts with pagination
export const getAllPosts = async (page = 1, limit = 20) => {
  try {
    const response = await api.get(`/posts?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

// Search posts
export const searchPosts = async (query, page = 1, limit = 20) => {
  try {
    const response = await api.get(`/posts/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error searching posts:', error);
    throw error;
  }
};

// Get posts by location
export const getPostsByLocation = async (location, page = 1, limit = 20) => {
  try {
    const response = await api.get(`/posts/location/${encodeURIComponent(location)}?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching posts by location:', error);
    throw error;
  }
};

// Get user's posts
export const getUserPosts = async (userId, page = 1, limit = 20) => {
  try {
    const response = await api.get(`/posts/user/${userId}?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user posts:', error);
    throw error;
  }
};

// Create a new post
export const createPost = async (formData) => {
  try {
    console.log('Creating post with formData:', formData);
    const response = await api.post('/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating post:', error.response?.data || error.message);
    throw error;
  }
};

// Add reply to a post
export const addReply = async (postId, replyData) => {
  try {
    const response = await api.post(`/posts/${postId}/reply`, replyData);
    return response.data;
  } catch (error) {
    console.error('Error adding reply:', error);
    throw error;
  }
};

// Toggle like on a post
export const toggleLike = async (postId) => {
  try {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data;
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
};

// Delete a post
export const deletePost = async (postId) => {
  try {
    const response = await api.delete(`/posts/${postId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

export default {
  getAllPosts,
  searchPosts,
  getPostsByLocation,
  getUserPosts,
  createPost,
  addReply,
  toggleLike,
  deletePost,
}; 