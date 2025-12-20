import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export const useFetch = (url, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get(url);
        setData(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.error || 'Something went wrong');
        toast.error(err.response?.data?.error || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    if (url) {
      fetchData();
    }
  }, dependencies);

  const refetch = async () => {
    try {
      setLoading(true);
      const response = await api.get(url);
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
};
