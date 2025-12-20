import { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = async (method, url, data = null, config = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (method === 'get' || method === 'delete') {
        response = await api[method](url, config);
      } else {
        response = await api[method](url, data, config);
      }
      
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Something went wrong';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const get = (url, config) => request('get', url, null, config);
  const post = (url, data, config) => request('post', url, data, config);
  const put = (url, data, config) => request('put', url, data, config);
  const del = (url, config) => request('delete', url, null, config);

  return { loading, error, get, post, put, del };
};
