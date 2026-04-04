import { useState } from 'react';
import { Lock, Unlock, Eye, EyeOff, Copy, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PasswordProtectionModal({ isOpen, onClose, targetType, targetName, onProtect }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordHash, setPasswordHash] = useState('');
  const [mode, setMode] = useState('set'); // 'set' or 'verify'
  const [verifyPassword, setVerifyPassword] = useState('');

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const result = await base44.functions.invoke('passwordProtection', {
        action: 'hash',
        password
      });

      setPasswordHash(result.data.hash);
      setSuccess('Password set successfully!');
      setMode('verify');
      setPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        if (onProtect) {
          onProtect({
            type: targetType,
            name: targetName,
            hash: result.data.hash,
            protectedAt: new Date().toISOString()
          });
        }
        setTimeout(() => onClose(), 500);
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to set password');
    }
    setLoading(false);
  };

  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!verifyPassword) {
      setError('Enter password to verify');
      return;
    }

    setLoading(true);
    try {
      const result = await base44.functions.invoke('passwordProtection', {
        action: 'hash',
        password: verifyPassword
      });

      if (result.data.hash === passwordHash) {
        setSuccess('Password verified! ✓');
        setMode('set');
        setVerifyPassword('');
      } else {
        setError('Incorrect password');
      }
    } catch (err) {
      setError(err.message || 'Verification failed');
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#0e1018] border border-[#1e2330] rounded-xl w-full max-w-md p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-[#00c896]" />
          <div>
            <h3 className="text-lg font-semibold text-white">Password Protect</h3>
            <p className="text-xs text-gray-500">{targetType}: {targetName}</p>
          </div>
        </div>

        {/* Mode: Set Password */}
        {mode === 'set' && !passwordHash && (
          <form onSubmit={handleSetPassword} className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter strong password (6+ chars)"
                  className="w-full bg-[#1a1d26] border border-[#2a2d3a] text-gray-200 px-3 py-2 rounded outline-none focus:border-[#00c896]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full bg-[#1a1d26] border border-[#2a2d3a] text-gray-200 px-3 py-2 rounded outline-none focus:border-[#00c896]"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-xs text-red-300">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00c896] hover:bg-[#00b084] disabled:opacity-50 text-black text-sm font-semibold py-2 rounded transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {loading ? 'Setting...' : 'Set Password'}
            </button>
          </form>
        )}

        {/* Mode: Show Hash */}
        {passwordHash && mode === 'set' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-[#00c896]/10 border border-[#00c896]/30 rounded px-3 py-2">
              <CheckCircle className="w-4 h-4 text-[#00c896] shrink-0" />
              <span className="text-xs text-[#00c896]">{success}</span>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Password Hash (save this)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={passwordHash}
                  readOnly
                  className="flex-1 bg-[#1a1d26] border border-[#2a2d3a] text-gray-300 px-3 py-2 rounded text-xs font-mono overflow-x-auto"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(passwordHash);
                    setSuccess('Hash copied!');
                    setTimeout(() => setSuccess(''), 2000);
                  }}
                  className="bg-[#2a2d3a] hover:bg-[#3a3d4a] text-gray-400 px-3 py-2 rounded transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Store this hash to verify the password later without storing the password itself.</p>
            </div>

            <button
              onClick={() => {
                setMode('verify');
                setPasswordHash('');
                setPassword('');
                setConfirmPassword('');
              }}
              className="w-full bg-[#1a1d26] hover:bg-[#2a2d3a] text-gray-300 text-sm py-2 rounded transition-colors"
            >
              Set Another Password
            </button>
          </div>
        )}

        {/* Mode: Verify Password */}
        {mode === 'verify' && (
          <form onSubmit={handleVerifyPassword} className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Enter Password to Verify</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={verifyPassword}
                onChange={(e) => setVerifyPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-[#1a1d26] border border-[#2a2d3a] text-gray-200 px-3 py-2 rounded outline-none focus:border-[#00c896]"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-xs text-red-300">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 bg-[#00c896]/10 border border-[#00c896]/30 rounded px-3 py-2">
                <CheckCircle className="w-4 h-4 text-[#00c896] shrink-0" />
                <span className="text-xs text-[#00c896]">{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
              {loading ? 'Verifying...' : 'Verify Password'}
            </button>
          </form>
        )}

        {/* Footer */}
        <button
          onClick={onClose}
          className="w-full text-gray-500 hover:text-gray-300 text-sm py-1.5 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}