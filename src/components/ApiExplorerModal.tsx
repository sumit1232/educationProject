import React, { useState } from 'react';
import { Download, Play, FileCode, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { api } from '../utils/api';

interface ApiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EndpointDef {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  category: 'Auth' | 'Admin' | 'Teacher' | 'Student';
  description: string;
  requiresAuth: boolean;
  role?: string;
  sampleBody?: any;
}

const ENDPOINTS: EndpointDef[] = [
  {
    method: 'GET',
    path: '/api/health',
    category: 'Auth',
    description: 'Server health check, uptime, and security subsystem status',
    requiresAuth: false,
  },
  {
    method: 'POST',
    path: '/api/auth/login',
    category: 'Auth',
    description: 'Email/password authentication with bcrypt compare and HttpOnly cookies',
    requiresAuth: false,
    sampleBody: { email: 'admin@school.edu', password: 'Admin123!' },
  },
  {
    method: 'POST',
    path: '/api/auth/refresh',
    category: 'Auth',
    description: 'Token rotation: Invalidate old refresh token and return new JWT pair',
    requiresAuth: false,
  },
  {
    method: 'GET',
    path: '/api/auth/me',
    category: 'Auth',
    description: 'Fetch authenticated user profile via JWT access token',
    requiresAuth: true,
  },
  {
    method: 'GET',
    path: '/api/admin/stats',
    category: 'Admin',
    description: 'Administrative metrics (enrollment, faculty count, attendance rate)',
    requiresAuth: true,
    role: 'admin',
  },
  {
    method: 'GET',
    path: '/api/admin/users',
    category: 'Admin',
    description: 'List all institutional accounts with role definitions',
    requiresAuth: true,
    role: 'admin',
  },
  {
    method: 'GET',
    path: '/api/admin/audit-logs',
    category: 'Admin',
    description: 'Retrieve tamper-evident security audit stream',
    requiresAuth: true,
    role: 'admin',
  },
  {
    method: 'GET',
    path: '/api/teacher/classes',
    category: 'Teacher',
    description: 'Get assigned classrooms and scheduled courses',
    requiresAuth: true,
    role: 'teacher | admin',
  },
  {
    method: 'GET',
    path: '/api/teacher/attendance',
    category: 'Teacher',
    description: 'Fetch attendance roster for a class date',
    requiresAuth: true,
    role: 'teacher | admin',
  },
  {
    method: 'GET',
    path: '/api/student/dashboard',
    category: 'Student',
    description: 'Personal student academic dashboard, grades, and attendance stats',
    requiresAuth: true,
    role: 'student | admin | teacher',
  },
];

export const ApiExplorerModal: React.FC<ApiModalProps> = ({ isOpen, onClose }) => {
  const [activeCategory, setActiveCategory] = useState<'All' | 'Auth' | 'Admin' | 'Teacher' | 'Student'>('All');
  const [testResult, setTestResult] = useState<{ endpoint: string; status: number; body: any } | null>(null);
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleTestEndpoint = async (ep: EndpointDef) => {
    setTesting(true);
    try {
      let res: any;
      if (ep.method === 'GET') {
        res = await api.get(ep.path);
      } else if (ep.method === 'POST') {
        res = await api.post(ep.path, ep.sampleBody || {});
      }
      setTestResult({
        endpoint: `${ep.method} ${ep.path}`,
        status: res.success ? 200 : 400,
        body: res,
      });
    } catch (e: any) {
      setTestResult({
        endpoint: `${ep.method} ${ep.path}`,
        status: 500,
        body: { error: e.message },
      });
    } finally {
      setTesting(false);
    }
  };

  const handleDownloadPostman = () => {
    window.location.href = '/api/docs/postman-collection.json';
  };

  const filteredEndpoints =
    activeCategory === 'All' ? ENDPOINTS : ENDPOINTS.filter((e) => e.category === activeCategory);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 border border-gray-200 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
        {/* Header & Postman download */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-gray-900">RESTful API Endpoints & Postman Collection</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Production API contracts with JWT HttpOnly cookies, rate limits, and RBAC middleware.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPostman}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" /> Download Postman Collection
            </button>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 text-sm font-bold">
              ✕
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-1 border-b border-gray-200 pb-2 text-xs font-medium">
          {(['All', 'Auth', 'Admin', 'Teacher', 'Student'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeCategory === cat ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Endpoints List */}
        <div className="space-y-2">
          {filteredEndpoints.map((ep, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl border border-gray-200 bg-gray-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      ep.method === 'GET'
                        ? 'bg-blue-100 text-blue-800'
                        : ep.method === 'POST'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-mono font-semibold text-gray-900">{ep.path}</span>
                  {ep.requiresAuth && (
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                      RBAC: {ep.role || 'Authenticated'}
                    </span>
                  )}
                </div>
                <p className="text-gray-500 mt-1">{ep.description}</p>
              </div>

              <button
                onClick={() => handleTestEndpoint(ep)}
                disabled={testing}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 transition-colors shrink-0 self-start sm:self-auto"
              >
                <Play className="w-3 h-3 text-indigo-600" /> Test Live
              </button>
            </div>
          ))}
        </div>

        {/* Live Response Console */}
        {testResult && (
          <div className="mt-4 bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-indigo-400 font-semibold">{testResult.endpoint}</span>
              <span
                className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                  testResult.status === 200 ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                }`}
              >
                Status: {testResult.status}
              </span>
            </div>
            <pre className="p-3 bg-slate-950 rounded-lg overflow-x-auto text-[11px] text-slate-300 max-h-48">
              {JSON.stringify(testResult.body, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
