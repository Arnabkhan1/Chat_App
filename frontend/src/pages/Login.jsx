import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/authService';
import useAuthStore from '../context/authStore';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      setAuth(data, data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-nebula-bg px-4">
      <div className="bg-nebula-panel border border-nebula-border p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bubble-gradient flex items-center justify-center text-2xl mb-4 shadow-glow">
            💬
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
          <p className="text-nebula-muted text-sm mt-1">Log in to keep the conversation going</p>
        </div>

        {error && (
          <p className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm p-3 rounded-xl mb-4">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full p-3 rounded-xl bg-nebula-elevated text-white outline-none border border-transparent focus:border-nebula-primary placeholder-nebula-muted transition"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full p-3 rounded-xl bg-nebula-elevated text-white outline-none border border-transparent focus:border-nebula-primary placeholder-nebula-muted transition"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bubble-gradient text-white p-3 rounded-xl font-semibold hover:opacity-90 active:opacity-80 transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-nebula-muted text-sm mt-5 text-center">
          Don't have an account?{' '}
          <Link to="/signup" className="text-nebula-glow hover:text-white transition">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;