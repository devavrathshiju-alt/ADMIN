import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Registration from './pages/Registration';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import CRDashboard from './pages/CRDashboard';
import Success from './pages/Success';
import Layout from './components/Layout';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('admin_token', token);
    } else {
      localStorage.removeItem('admin_token');
    }
  }, [token]);

  return (
    <Router>
      <Layout token={token} setToken={setToken}>
        <Routes>
          <Route path="/" element={<Navigate to="/register" replace />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/success" element={<Success />} />
          <Route path="/cr/:referralCode" element={<CRDashboard />} />
          <Route 
            path="/admin/login" 
            element={token ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin setToken={setToken} />} 
          />
          <Route 
            path="/admin/dashboard/*" 
            element={token ? <AdminDashboard token={token} /> : <Navigate to="/admin/login" replace />} 
          />
        </Routes>
      </Layout>
    </Router>
  );
}
