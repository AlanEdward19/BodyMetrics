import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Activity, LayoutDashboard, UserPlus } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
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
        </ul>
      </div>
    </nav>
  );
}
