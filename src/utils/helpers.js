import { formatDistanceToNow, format } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const formatFullDate = (date) => {
  if (!date) return '';
  return format(new Date(date), 'PPP');
};

export const formatTime = (date) => {
  if (!date) return '';
  return format(new Date(date), 'p');
};

export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const getFilePreview = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
