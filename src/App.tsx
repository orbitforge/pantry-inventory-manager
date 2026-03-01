import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Package, ScanLine, ShoppingCart, Settings as SettingsIcon } from 'lucide-react';
import InventoryList from './components/InventoryList';
import GroceryList from './components/GroceryList';
import Settings from './components/Settings';
import Scanner from './components/Scanner';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<InventoryList />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/grocery" element={<GroceryList />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>

      <nav className="bottom-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Package size={24} />
          <span>Pantry</span>
        </NavLink>
        <NavLink to="/scanner" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <ScanLine size={24} />
          <span>Scanner</span>
        </NavLink>
        <NavLink to="/grocery" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <ShoppingCart size={24} />
          <span>Grocery List</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <SettingsIcon size={24} />
          <span>Settings</span>
        </NavLink>
      </nav>
    </Router>
  );
}

export default App;
