import './App.css'
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Authentication from './pages/Authentication';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import HomeComponent from './pages/Home';
import History from './pages/History';
import Profile from './pages/Profile';
import VideoMeetComponent from './pages/VideoMeet';
import PrivateRoute from './components/PrivateRoute';
import { Toaster } from './components/ui/sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevents excessive refetching
      retry: 1,                    // Retry failing requests once
      staleTime: 5 * 60 * 1000,    // Cache data for 5 minutes by default
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
         <ThemeProvider>
         <Router>
            <AuthProvider>
              <Routes>
                  <Route path='/' element={<LandingPage />} />
                  <Route path='/auth' element={<Authentication />} />
                  <Route path='*' element={<LandingPage />} />

                  {/* Protected Routes */}
                  <Route element={<PrivateRoute />}>
                      <Route path='/home' element={<HomeComponent />} /> 
                      <Route path='/history' element={<History />} />
                      <Route path='/profile' element={<Profile />} />
                      <Route path='/:url' element={<VideoMeetComponent />} />
                  </Route>
              </Routes>
              <Toaster
                position="top-right"
                richColors
                expand={true}
                closeButton
                visibleToasts={9}
                duration={5000}
              />
            </AuthProvider>
         </Router>
         </ThemeProvider>
      </div>
    </QueryClientProvider>
  );
}

export default App
