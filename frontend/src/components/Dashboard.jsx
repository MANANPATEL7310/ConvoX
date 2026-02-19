import { useAuth } from '../context/useAuth';

const Dashboard = () => {
  const { user, logout } = useAuth();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#242424] text-white p-8">
      <h1 className="text-4xl font-bold mb-4">Welcome, {user.username}!</h1>
      <p className="text-xl mb-8 text-[#888]">Email: {user.email}</p>
      <button 
        onClick={logout}
        className="px-6 py-3 font-semibold text-white bg-[#646cff] rounded-lg border-0 cursor-pointer transition-colors duration-200 hover:bg-[#535bf2]"
      >
        Logout
      </button>
    </div>
  );
};

export default Dashboard;
