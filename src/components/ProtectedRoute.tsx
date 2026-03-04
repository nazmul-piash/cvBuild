import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="mb-4">Please log in to view this page.</p>
        <a href="/login" className="text-blue-600 hover:underline">Go to Login</a>
      </div>
    );
  }

  return <>{children}</>;
};
