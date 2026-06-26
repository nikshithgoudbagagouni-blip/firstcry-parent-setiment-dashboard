import React, { useState } from 'react';
import axios from 'axios';
import { GraduationCap, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

export default function Login({ onLoginSuccess, backendUrl }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${backendUrl}/api/login`, { email, password });
      
      if (response.data && response.data.user) {
        onLoginSuccess(response.data.user, response.data.token);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] px-4 relative overflow-hidden">
      {/* Dynamic glowing background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#FF8562]/10 blur-3xl glow-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[#88B097]/10 blur-3xl glow-glow" style={{ animationDelay: '3s' }} />

      <div className="w-full max-w-md relative z-10">
        <div className="glass-panel p-8 shadow-2xl border-[#E6DDD0] bg-white/95">
          
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#FF8562] to-[#FF6B4A] flex items-center justify-center shadow-lg shadow-[#FF8562]/35 mb-4">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#4A433A] tracking-tight">FirstCry Intellitots</h2>
            <p className="text-sm text-[#7D7263] mt-1 font-semibold">Parent Sentiment & Engagement Portal</p>
          </div>

          {/* Form Actions */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 p-3.5 bg-rose-50/10 border border-rose-100 rounded-xl text-rose-600 text-xs font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="form-label" htmlFor="email">Administrative Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 h-4 w-4 text-[#9E9588]" />
                <input
                  id="email"
                  type="email"
                  placeholder="name@firstcry.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input pl-11"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="form-label mb-0" htmlFor="password">Security Password</label>
                <span className="text-[10px] text-[#7D7263] font-semibold">Demo: admin / admin</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-4 w-4 text-[#9E9588]" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pl-11"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-sm mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Validating credentials...</span>
                </>
              ) : (
                <span>Access Console</span>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
