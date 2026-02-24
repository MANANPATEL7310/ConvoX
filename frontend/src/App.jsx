import './App.css'
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Authentication from './pages/Authentication';
import { AuthProvider } from './contexts/AuthContext.jsx';
import HomeComponent from './pages/Home';
import History from './pages/History';
import VideoMeetComponent from './pages/VideoMeet';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <div className="App">
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
                      <Route path='/:url' element={<VideoMeetComponent />} />
                  </Route>
              </Routes>
          </AuthProvider>
       </Router>
    </div>
  )
}

export default App
