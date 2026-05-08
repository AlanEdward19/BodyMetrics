import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AthleteDashboard from './pages/AthleteDashboard';
import AddAthlete from './pages/AddAthlete';
import AddAssessment from './pages/AddAssessment';
import LoginPage from './pages/LoginPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return null; // Ou um spinner/skeleton
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function AppContent() {
  const { user } = useAuth();
  
  return (
    <div className="app-container">
      {user && <Navbar />}
      <main className={user ? "main-content" : "auth-content"}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
          
          <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><AthleteDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/:athleteId" element={<ProtectedRoute><AthleteDashboard /></ProtectedRoute>} />
          <Route path="/add" element={<ProtectedRoute><AddAthlete /></ProtectedRoute>} />
          <Route path="/edit/:athleteId" element={<ProtectedRoute><AddAthlete /></ProtectedRoute>} />
          <Route path="/add-assessment" element={<ProtectedRoute><AddAssessment /></ProtectedRoute>} />
          <Route path="/add-assessment/:athleteId" element={<ProtectedRoute><AddAssessment /></ProtectedRoute>} />
          <Route path="/edit-assessment/:assessmentId" element={<ProtectedRoute><AddAssessment /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
