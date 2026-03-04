import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { LogOut, FileText } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-indigo-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">Lebenslauf AI</span>
          </div>
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">{user.email}</span>
                <button
                  onClick={logout}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-x-4">
                <a href="/login" className="text-gray-700 hover:text-indigo-600 font-medium">Login</a>
                <a href="/register" className="text-gray-700 hover:text-indigo-600 font-medium">Register</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
