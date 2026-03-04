import React from 'react';
import { Settings, ExternalLink, Key } from 'lucide-react';

export const SetupGuide: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
        <div className="bg-indigo-600 p-6 text-white">
          <div className="flex items-center space-x-3">
            <Settings className="h-8 w-8 animate-spin-slow" />
            <h1 className="text-2xl font-bold">Supabase Setup Required</h1>
          </div>
          <p className="mt-2 opacity-90">
            To make the application functional, you need to connect your Supabase project.
          </p>
        </div>
        
        <div className="p-8 space-y-6">
          <section>
            <h2 className="flex items-center text-lg font-semibold text-gray-900 mb-3">
              <ExternalLink className="h-5 w-5 mr-2 text-indigo-600" />
              1. Get your API Keys
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-medium hover:underline">Supabase Dashboard</a>, select your project, and navigate to <strong>Project Settings &gt; API</strong>.
            </p>
          </section>

          <section>
            <h2 className="flex items-center text-lg font-semibold text-gray-900 mb-3">
              <Key className="h-5 w-5 mr-2 text-indigo-600" />
              2. Add to AI Studio Secrets
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Open the <strong>Secrets</strong> panel in AI Studio and add the following keys:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs space-y-2 border border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-indigo-700 font-bold">VITE_SUPABASE_URL</span>
                <span className="text-gray-400">Project URL</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-indigo-700 font-bold">VITE_SUPABASE_ANON_KEY</span>
                <span className="text-gray-400">anon public key</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-indigo-700 font-bold">SUPABASE_SERVICE_ROLE_KEY</span>
                <span className="text-gray-400">service_role secret key</span>
              </div>
            </div>
          </section>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 italic">
              Once added, refresh the preview to start using the app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
