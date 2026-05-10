import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Activity, LayoutDashboard, UserPlus, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/dashboard" className="navbar-brand" style={{ textDecoration: 'none' }}>
          <div className="navbar-logo-wrapper">
            <Activity className="navbar-logo" size={24} strokeWidth={2.5} />
          </div>
          <span className="navbar-title">BodyMetrics</span>
        </Link>
        <ul className="navbar-menu">
          <li>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/add" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <UserPlus size={18} />
              <span>Novo Atleta</span>
            </NavLink>
          </li>
          {user && (
            <li className="navbar-user-section">
              <div className="user-profile">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="user-avatar" />
                ) : (
                  <div className="user-avatar-placeholder">
                    {user.displayName?.charAt(0) || user.email?.charAt(0)}
                  </div>
                )}
                <span className="user-name">{user.displayName || user.email?.split('@')[0]}</span>
              </div>
              <button onClick={handleLogout} className="nav-link btn-logout-nav" title="Sair">
                <LogOut size={18} />
              </button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}
