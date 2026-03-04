import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar.tsx';
import { Upload, FileText, Download, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase.ts';

interface CVHistory {
  id: number;
  original_filename: string;
  created_at: string;
}

export const Dashboard: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultId, setResultId] = useState<number | null>(null);
  const [history, setHistory] = useState<CVHistory[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('cvs')
        .select('id, original_filename, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Failed to fetch history', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !jobDescription) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('cv', file);
    formData.append('jobDescription', jobDescription);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch('/api/cv/optimize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data.optimizedContent);
        setResultId(data.id);
        fetchHistory();
      } else {
        alert('Optimization failed');
      }
    } catch (error) {
      console.error('Error optimizing CV', error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    window.open(`/api/cv/download/${id}?token=${session?.access_token}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                <div className="md:grid md:grid-cols-3 md:gap-6">
                  <div className="md:col-span-1">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Optimize Your CV</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Upload your current CV and paste the job description to generate a tailored German Lebenslauf.
                    </p>
                  </div>
                  <div className="mt-5 md:mt-0 md:col-span-2">
                    <form onSubmit={handleSubmit}>
                      <div className="grid grid-cols-6 gap-6">
                        <div className="col-span-6">
                          <label className="block text-sm font-medium text-gray-700">Upload CV (PDF/DOCX)</label>
                          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                              <Upload className="mx-auto h-12 w-12 text-gray-400" />
                              <div className="flex text-sm text-gray-600">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                  <span>Upload a file</span>
                                  <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.docx" />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                              </div>
                              <p className="text-xs text-gray-500">PDF or DOCX up to 10MB</p>
                              {file && <p className="text-sm text-green-600 font-semibold">{file.name}</p>}
                            </div>
                          </div>
                        </div>

                        <div className="col-span-6">
                          <label htmlFor="job-description" className="block text-sm font-medium text-gray-700">
                            Job Description
                          </label>
                          <div className="mt-1">
                            <textarea
                              id="job-description"
                              name="job-description"
                              rows={5}
                              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                              placeholder="Paste the job description here..."
                              value={jobDescription}
                              onChange={(e) => setJobDescription(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 mt-4">
                        <button
                          type="submit"
                          disabled={loading || !file || !jobDescription}
                          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          {loading ? <Loader className="animate-spin h-5 w-5" /> : 'Generate Optimized CV'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              {result && (
                <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Optimized Result</h3>
                    {resultId && (
                      <button
                        onClick={() => handleDownload(resultId)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </button>
                    )}
                  </div>
                  <div className="prose max-w-none whitespace-pre-wrap bg-gray-50 p-4 rounded-md text-sm">
                    {result}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar History */}
            <div className="md:col-span-1">
              <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">History</h3>
                </div>
                <ul className="divide-y divide-gray-200">
                  {history.map((item) => (
                    <li key={item.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 flex justify-between items-center">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-indigo-600 truncate">{item.original_filename}</p>
                          <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button onClick={() => handleDownload(item.id)} className="text-gray-400 hover:text-gray-600">
                        <Download className="h-5 w-5" />
                      </button>
                    </li>
                  ))}
                  {history.length === 0 && (
                    <li className="px-4 py-4 text-sm text-gray-500 text-center">No history yet.</li>
                  )}
                </ul>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
