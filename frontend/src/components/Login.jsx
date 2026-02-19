import { useState } from 'react';
import { useAuth } from '../context/useAuth';

const Login = ({ onSwitchToSignup }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-full bg-[#242424]">
      <form onSubmit={handleSubmit} className="bg-[#1a1a1a] p-10 rounded-2xl shadow-lg w-full max-w-md flex flex-col gap-6 border border-[#333]">
        <h2 className="m-0 mb-2 text-center text-white text-3xl font-bold">Welcome Back</h2>
        {error && <div className="text-red-500 text-center">{error}</div>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="p-3 rounded-lg border border-[#333] bg-[#2a2a2a] text-white text-base transition-all duration-200 focus:outline-none focus:border-[#646cff] focus:ring-2 focus:ring-[#646cff]/20"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="p-3 rounded-lg border border-[#333] bg-[#2a2a2a] text-white text-base transition-all duration-200 focus:outline-none focus:border-[#646cff] focus:ring-2 focus:ring-[#646cff]/20"
        />
        <button 
          type="submit"
          className="mt-4 p-3 text-lg font-semibold bg-[#646cff] text-white border-0 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-[#535bf2]"
        >
          Log In
        </button>
        <div className="text-center mt-4 text-[#888]">
          Don't have an account?
          <button 
            type="button" 
            onClick={onSwitchToSignup}
            className="ml-2 bg-transparent border-none text-[#646cff] p-0 text-inherit cursor-pointer underline hover:text-[#535bf2] hover:bg-transparent"
          >
            Sign up
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
