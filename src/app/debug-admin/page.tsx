'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DebugAdminPage() {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<string | null>(null);
  const [parsedUser, setParsedUser] = useState<any>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Get current localStorage values
    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUser');
    
    setAdminToken(token);
    setAdminUser(user);

    // Try to parse user data
    if (user) {
      try {
        const parsed = JSON.parse(user);
        setParsedUser(parsed);
        setParseError(null);
      } catch (error) {
        setParseError(error instanceof Error ? error.message : 'Unknown parse error');
        setParsedUser(null);
      }
    }
  }, []);

  const clearLocalStorage = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setAdminToken(null);
    setAdminUser(null);
    setParsedUser(null);
    setParseError(null);
    alert('Admin localStorage data cleared!');
  };

  const goToAdminLogin = () => {
    router.push('/admin-login');
  };

  const goToAdmin = () => {
    router.push('/admin');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Admin Debug Page</h1>
        
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Admin Token</h2>
            <div className="bg-gray-50 p-3 rounded border">
              <code>{adminToken || 'null'}</code>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Admin User (Raw)</h2>
            <div className="bg-gray-50 p-3 rounded border">
              <code>{adminUser || 'null'}</code>
            </div>
          </div>

          {parseError && (
            <div>
              <h2 className="text-lg font-semibold mb-2 text-red-600">Parse Error</h2>
              <div className="bg-red-50 p-3 rounded border border-red-200">
                <code className="text-red-700">{parseError}</code>
              </div>
            </div>
          )}

          {parsedUser && (
            <div>
              <h2 className="text-lg font-semibold mb-2 text-green-600">Parsed User</h2>
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <pre className="text-sm">{JSON.stringify(parsedUser, null, 2)}</pre>
              </div>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              onClick={clearLocalStorage}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Clear localStorage
            </button>
            <button
              onClick={goToAdminLogin}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Go to Admin Login
            </button>
            <button
              onClick={goToAdmin}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Go to Admin Panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}