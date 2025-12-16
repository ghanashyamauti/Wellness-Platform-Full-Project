import { useEffect } from 'react';

const AdminRedirect = () => {
  useEffect(() => {
    window.location.href = '/admin';
  }, []);

  return null;
};

export default AdminRedirect;
