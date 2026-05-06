import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AthleteDashboard from './pages/AthleteDashboard';
import AddAthlete from './pages/AddAthlete';
import AddAssessment from './pages/AddAssessment';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<AthleteDashboard />} />
            <Route path="/dashboard/:athleteId" element={<AthleteDashboard />} />
            <Route path="/add" element={<AddAthlete />} />
            <Route path="/edit/:athleteId" element={<AddAthlete />} />
            <Route path="/add-assessment" element={<AddAssessment />} />
            <Route path="/add-assessment/:athleteId" element={<AddAssessment />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
