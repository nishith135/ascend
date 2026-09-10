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
import CoachPage from './pages/CoachPage';
import NutritionPage from './pages/NutritionPage';
import SocialPage from './pages/SocialPage';
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
          title="Sign Out"
          className="text-on-surface-variant hover:bg-primary-container/10 transition-colors active:scale-95 duration-200 p-2 rounded-full flex items-center justify-center"
        >
          <span className="material-symbols-outlined">logout</span>
        </button>
        <h1 className="font-monarch-display text-category-header text-primary drop-shadow-[0_0_10px_rgba(225,29,72,0.4)] tracking-widest uppercase">
          STATUS WINDOW
        </h1>
        <NavLink 
          to="/guild"
          title="Hunter Guild"
          className="text-on-surface-variant hover:bg-primary-container/10 transition-colors active:scale-95 duration-200 p-2 rounded-full flex items-center justify-center"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
        </NavLink>
      </div>
    </header>
  );
}

function BottomNavBar() {
  return (
    <nav className="fixed bottom-0 w-full md:max-w-md z-50 backdrop-blur-md rounded-t-[20px] bg-surface-container/80 border-t border-primary-container/20 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
      <div className="flex justify-around items-center px-3 py-2">
        <NavLink 
          to="/" 
          end 
          title="Status Window"
          className={({ isActive }) => `flex flex-col items-center justify-center transition-all duration-300 ${isActive ? 'bg-primary-container/20 text-primary-container rounded-full p-2.5 shadow-[0_0_15px_rgba(225,29,72,0.4)]' : 'text-outline p-2 hover:text-primary active:scale-90'}`}
        >
          <span className="material-symbols-outlined text-[22px]">dashboard</span>
        </NavLink>

        <NavLink 
          to="/exercises" 
          title="Exercise Library"
          className={({ isActive }) => `flex flex-col items-center justify-center transition-all duration-300 ${isActive ? 'bg-primary-container/20 text-primary-container rounded-full p-2.5 shadow-[0_0_15px_rgba(225,29,72,0.4)]' : 'text-outline p-2 hover:text-primary active:scale-90'}`}
        >
          <span className="material-symbols-outlined text-[22px]">fitness_center</span>
        </NavLink>

        {/* Nutrition — Phase 4 */}
        <NavLink 
          to="/nutrition" 
          title="Supply Depot (Mana & Fuel)"
          className={({ isActive }) => `flex flex-col items-center justify-center transition-all duration-300 ${isActive ? 'bg-cyan-500/20 text-cyan-300 rounded-full p-2.5 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'text-outline p-2 hover:text-cyan-300 active:scale-90'}`}
        >
          <span className="material-symbols-outlined text-[22px]">water_drop</span>
        </NavLink>

        {/* Social / Guild — Phase 4 */}
        <NavLink 
          to="/guild" 
          title="Hunter Guild Hall"
          className={({ isActive }) => `flex flex-col items-center justify-center transition-all duration-300 ${isActive ? 'bg-primary-container/20 text-primary-container rounded-full p-2.5 shadow-[0_0_15px_rgba(225,29,72,0.4)]' : 'text-outline p-2 hover:text-primary active:scale-90'}`}
        >
          <span className="material-symbols-outlined text-[22px]">groups</span>
        </NavLink>

        {/* AI Coach */}
        <NavLink 
          to="/coach" 
          title="System AI Coach"
          className={({ isActive }) => `flex flex-col items-center justify-center transition-all duration-300 ${isActive ? 'bg-primary-container/20 text-primary-container rounded-full p-2.5 shadow-[0_0_15px_rgba(225,29,72,0.4)]' : 'text-outline p-2 hover:text-primary active:scale-90'}`}
        >
          <span className="material-symbols-outlined text-[22px]">psychology</span>
        </NavLink>

        {/* Achievements */}
        <NavLink 
          to="/achievements" 
          title="Hunter Titles & Achievements"
          className={({ isActive }) => `flex flex-col items-center justify-center transition-all duration-300 ${isActive ? 'bg-primary-container/20 text-primary-container rounded-full p-2.5 shadow-[0_0_15px_rgba(225,29,72,0.4)]' : 'text-outline p-2 hover:text-primary active:scale-90'}`}
        >
          <span className="material-symbols-outlined text-[22px]">military_tech</span>
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
          <Route path="/coach" element={<CoachPage />} />
          <Route path="/nutrition" element={<NutritionPage />} />
          <Route path="/guild" element={<SocialPage />} />
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
