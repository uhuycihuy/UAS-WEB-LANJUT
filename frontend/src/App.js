import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardAdmin from './pages/DashboardAdmin';
import KelolaBarang from './pages/KelolaBarang';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardAdmin />} />
        <Route path="/kelola-barang" element={<KelolaBarang />} />
      </Routes>
    </Router>
  );
};

export default App;
