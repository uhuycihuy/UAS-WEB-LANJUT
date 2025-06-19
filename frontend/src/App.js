import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardAdmin from './pages/DashboardAdmin';
import KelolaBarang from './pages/KelolaBarang';
import FormEditBarang from './components/FormEditBarang';
import AddBarangMasuk from './pages/AddBarangMasuk';
import BarangMasuk from './pages/BarangMasuk';
import FormBarangKeluar from './components/FormBarangKeluar';
import BarangKeluar from './pages/BarangKeluar';
import CekStokBarang from "./pages/CekStokBarang";
import Laporan from "./pages/LaporanInventori";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardAdmin />} />
        <Route path="/kelola-barang" element={<KelolaBarang />} />
        <Route path="/edit-barang/:id" element={<FormEditBarang />} />
        <Route path="/tambah-barang" element={<AddBarangMasuk />} />
        <Route path="/barang-masuk" element={<BarangMasuk />} />
        <Route path="/barang-keluar/form/:id" element={<FormBarangKeluar />} />
        <Route path="/barang-keluar" element={<BarangKeluar />} />
        <Route path="/cek-stok" element={<CekStokBarang />} />
        <Route path="/laporan" element={<Laporan />} />
      </Routes>
    </Router>
  );
};

export default App;
