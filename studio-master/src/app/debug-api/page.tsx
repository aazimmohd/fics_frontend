"use client";

import { useState } from 'react';
import { apiRequest } from '@/lib/api';

export default function DebugApiPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testApiCall = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/notifications/counts');
      setResult(JSON.stringify(response, null, 2));
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testDirectFetch = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/notifications/counts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">API Debug Page</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Test API Request Function</h2>
          <button 
            onClick={testApiCall}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test apiRequest()'}
          </button>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Test Direct Fetch</h2>
          <button 
            onClick={testDirectFetch}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Direct Fetch'}
          </button>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Result:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {result || 'No result yet'}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Current Token:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {localStorage.getItem('access_token')?.substring(0, 50) + '...' || 'No token'}
          </pre>
        </div>
      </div>
    </div>
  );
} 