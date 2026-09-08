import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SystemNotificationProvider } from './context/SystemNotificationContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ExerciseLibraryPage from './pages/ExerciseLibraryPage';
import TemplatesPage from './pages/TemplatesPage';
import ActiveWorkoutPage from './pages/ActiveWorkoutPage';
import HistoryPage from './pages/HistoryPage';
import AchievementsPage from './pages/AchievementsPage';
import ShaderBackground from './components/ShaderBackground';
import SystemToastContainer from './components/SystemToastContainer';
import LevelUpOverlay from './components/LevelUpOverlay';
import RankUpOverlay from './components/RankUpOverlay';
import AchievementPopup from './components/AchievementPopup';
import './index.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-monarch-crimson border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-monarch-crimson border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function TopAppBar() {
  const { logout } = useAuth();
  return (
    <header className="fixed top-0 w-full md:max-w-md z-50 backdrop-blur-xl bg-surface/40 border-b border-primary-container/20 shadow-[0_0_15px_rgba(225,29,72,0.2)]">
      <div className="flex justify-between items-center px-gutter h-16">
        <button 
          onClick={logout}
          className="text-on-surface-variant hover:bg-primary-container/10 transition-colors active:scale-95 duration-200 p-2 rounded-full flex items-center justify-center"
        >
          <span className="material-symbols-outlined">logout</span>
        </button>
        <h1 className="font-monarch-display text-category-header text-primary drop-shadow-[0_0_10px_rgba(225,29,72,0.4)] tracking-widest uppercase">
          STATUS WINDOW
        </h1>
        <button className="text-on-surface-variant hover:bg-primary-container/10 transition-colors active:scale-95 duration-200 p-2 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
        </button>
      </div>
    </header>
  );
}

function BottomNavBar() {
  return (
    <nav className="fixed bottom-0 w-full md:max-w-md z-50 backdrop-blur-md rounded-t-[20px] bg-surface-container/60 border-t border-primary-container/10 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
      <div className="flex justify-around items-center px-6 py-3">
        <NavLink to="/" end className={({ isActive }) => `flex flex-col items-center justify-center transition-all duration-300 ${isActive ? 'bg-primary-container/20 text-primary-container rounded-full p-3 shadow-[0_0_15px_rgba(225,29,72,0.4)]' : 'text-outline p-3 hover:text-primary active:scale-90'}`}>
          <span className="material-symbols-outlined">dashboard</span>
        </NavLink>
        <NavLink to="/exercises" className={({ isActive }) => `flex flex-col items-center justify-center transition-all duration-300 ${isActive ? 'bg-primary-container/20 text-primary-container rounded-full p-3 shadow-[0_0_15px_rgba(225,29,72,0.4)]' : 'text-outline p-3 hover:text-primary active:scale-90'}`}>
          <span className="material-symbols-outlined">fitness_center</span>
        </NavLink>
        <NavLink to="/templates" className={({ isActive }) => `flex flex-col items-center justify-center transition-all duration-300 ${isActive ? 'bg-primary-container/20 text-primary-container rounded-full p-3 shadow-[0_0_15px_rgba(225,29,72,0.4)]' : 'text-outline p-3 hover:text-primary active:scale-90'}`}>
          <span className="material-symbols-outlined">bolt</span>
        </NavLink>
        <NavLink to="/achievements" className={({ isActive }) => `flex flex-col items-center justify-center transition-all duration-300 ${isActive ? 'bg-primary-container/20 text-primary-container rounded-full p-3 shadow-[0_0_15px_rgba(225,29,72,0.4)]' : 'text-outline p-3 hover:text-primary active:scale-90'}`}>
          <span className="material-symbols-outlined">military_tech</span>
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => `flex flex-col items-center justify-center transition-all duration-300 ${isActive ? 'bg-primary-container/20 text-primary-container rounded-full p-3 shadow-[0_0_15px_rgba(225,29,72,0.4)]' : 'text-outline p-3 hover:text-primary active:scale-90'}`}>
          <span className="material-symbols-outlined">history</span>
        </NavLink>
      </div>
    </nav>
  );
}

function AppLayout() {
  const location = useLocation();
  const isWorkoutActive = location.pathname === '/workout';

  return (
    <div className="relative z-10 flex flex-col min-h-screen md:max-w-md md:mx-auto shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-surface-container-lowest/80 backdrop-blur-sm pb-24">
      {!isWorkoutActive && <TopAppBar />}
      {!isWorkoutActive && <div className="h-20"></div>}
      
      <main className="flex-1 px-4 space-y-panel-gap flex flex-col">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/exercises" element={<ExerciseLibraryPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/workout" element={<ActiveWorkoutPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
        </Routes>
      </main>

      {!isWorkoutActive && <BottomNavBar />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SystemNotificationProvider>
          <ShaderBackground />
          {/* Global gamification overlays */}
          <SystemToastContainer />
          <LevelUpOverlay />
          <RankUpOverlay />
          <AchievementPopup />
          <Routes>
            <Route
              path="/login"
              element={<PublicRoute><LoginPage /></PublicRoute>}
            />
            <Route
              path="/register"
              element={<PublicRoute><RegisterPage /></PublicRoute>}
            />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </SystemNotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
