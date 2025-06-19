import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Kelola Barang', path: '/kelola-barang' },
    { name: 'Barang Masuk', path: '/barang-masuk' },
    { name: 'Barang Keluar', path: '/barang-keluar' },
    { name: 'Cek Stok', path: '/cek-stok' },
    { name: 'Laporan', path: '/laporan' },
  ];

  return (
    <div className="bg-light p-3 vh-100" style={{ width: '220px' }}>
      <div className="text-center mb-4">
        <img src="/logo-rimas.jpg" alt="Rimas Laptop" style={{ width: '100px', height: 'auto' }} />
        <h6 className="mt-2">Inventory Toko Laptop</h6>
      </div>
      <ul className="nav flex-column">
        {navItems.map((item) => (
          <li key={item.path} className="nav-item mb-2">
            <Link
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active text-primary fw-bold' : 'text-dark'}`}
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
