// API utility functions for making requests to the Django backend
import { API_BASE_URL } from './config';

const getAuthToken = () => localStorage.getItem('user_token') || localStorage.getItem('admin_token');

export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
};

// Auth APIs
export const loginUser = (username: string, password: string) =>
  apiCall('/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

export const registerUser = (userData: any) =>
  apiCall('/register/', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

export const getMemberProfile = () =>
  apiCall('/members/me/');

// Blog APIs
export const getBlogPosts = () =>
  apiCall('/blog/');

export const searchBlogPosts = (query: string) =>
  apiCall(`/blog/search/?q=${query}`);

// Testimonies APIs
export const getTestimonies = () =>
  apiCall('/testimonies/');

export const getFeaturedTestimonies = () =>
  apiCall('/testimonies/featured/');

// Staff APIs
export const getStaffMembers = () =>
  apiCall('/staff/');

export const getStaffByDepartment = (department: string) =>
  apiCall(`/staff/by_department/?department=${department}`);

// Forums APIs
export const getForumCategories = () =>
  apiCall('/forum-categories/');

export const getForumThreads = (categoryId?: number) => {
  const query = categoryId ? `?category_id=${categoryId}` : '';
  return apiCall(`/forum-threads/${query}`);
};

export const createForumThread = (data: any) =>
  apiCall('/forum-threads/', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Sermons APIs
export const getSermons = () =>
  apiCall('/sermons/');

export const searchSermons = (query: string) =>
  apiCall(`/sermons/search/?q=${query}`);

// Events APIs
export const getEvents = () =>
  apiCall('/events/');

export const registerForEvent = (eventId: number) =>
  apiCall(`/events/${eventId}/register/`, { method: 'POST' });

// Payments APIs
export const createPayment = (data: any) =>
  apiCall('/payments/create_payment/', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Notifications APIs
export const getNotifications = () =>
  apiCall('/notifications/');

export const getUnreadNotifications = () =>
  apiCall('/notifications/unread/');

export const markNotificationAsRead = (id: number) =>
  apiCall(`/notifications/${id}/mark_as_read/`, { method: 'POST' });

// Analytics APIs
export const getAnalyticsDashboard = () =>
  apiCall('/analytics/dashboard/');
