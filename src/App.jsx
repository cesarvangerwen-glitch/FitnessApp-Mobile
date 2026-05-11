import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Toevoegen from './pages/Toevoegen.jsx'
import Zoeken from './pages/Zoeken.jsx'
import Grafiek from './pages/Grafiek.jsx'
import Dagen from './pages/Dagen.jsx'
import Dashboard from './pages/Dashboard.jsx'
import './App.css'
import Dag from './pages/Dag.jsx'
import Aanpassen from './pages/Aanpassen.jsx'
import Importeer from './pages/Importeer.jsx'

function NavBar() {
  const location = useLocation()
  const links = [
    { to: '/', label: '🏠', title: 'Home' },
    { to: '/toevoegen', label: '➕', title: 'Toevoegen' },
    { to: '/zoeken', label: '🔍', title: 'Zoeken' },
    { to: '/grafiek', label: '📈', title: 'Voortgang' },
    { to: '/dagen', label: '📅', title: 'Dagen' },
    { to: '/dashboard', label: '📊', title: 'Dashboard' },
  ]

  return (
    <nav className="navbar">
      {links.map(link => (
        <Link
          key={link.to}
          to={link.to}
          className={`nav-item ${location.pathname === link.to ? 'active' : ''}`}
          title={link.title}
        >
          <span className="nav-icon">{link.label}</span>
          <span className="nav-label">{link.title}</span>
        </Link>
      ))}
    </nav>
  )
}

function App() {
  return (
    <Router>
      <div className="app">
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/toevoegen" element={<Toevoegen />} />
            <Route path="/zoeken" element={<Zoeken />} />
            <Route path="/grafiek" element={<Grafiek />} />
            <Route path="/dagen" element={<Dagen />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dag/:datum" element={<Dag />} />
            <Route path="/aanpassen/:datum/:oefening" element={<Aanpassen />} />
            <Route path="/importeer" element={<Importeer />} />
          </Routes>
        </div>
        <NavBar />
      </div>
    </Router>
  )
}

export default App