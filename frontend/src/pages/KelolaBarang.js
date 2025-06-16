import React, { useState, useEffect } from 'react';
import axios from '../api/axiosInstance';
import Sidebar from '../components/Sidebar';

const KelolaBarang = () => {
  const [barang, setBarang] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchBarang();
  }, []);

  const fetchBarang = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/barang');
      setBarang(res.data);
    } catch (err) {
      console.error('Gagal mengambil data barang:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus barang ini?')) {
      try {
        await axios.delete(`http://localhost:3001/api/barang/${id}`);
        fetchBarang();
      } catch (err) {
        console.error('Gagal menghapus:', err);
      }
    }
  };

  const filteredData = barang.filter(item => {
    const matchSearch =
      item.nama_barang.toLowerCase().includes(search.toLowerCase()) ||
      item.kode_barang.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      filter === 'all' ||
      (filter === 'low' && item.stok < item.batas_minimal) ||
      (filter === 'high' && item.stok > item.batas_maksimal);

    return matchSearch && matchFilter;
  });

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1 p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2>Kelola Data Barang</h2>
          <button className="btn btn-primary">+ Tambah Barang</button>
        </div>

        <div className="d-flex mb-3">
          <input
            type="text"
            className="form-control me-2"
            placeholder="Cari berdasarkan nama atau kode barang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="form-select w-auto"
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Semua Stok</option>
            <option value="low">Stok Kurang</option>
            <option value="high">Stok Berlebih</option>
          </select>
        </div>

        <table className="table table-bordered table-striped">
          <thead className="table-light">
            <tr>
              <th>No</th>
              <th>Kode</th>
              <th>Nama</th>
              <th>Satuan</th>
              <th>Stok</th>
              <th>Batas Min</th>
              <th>Batas Max</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, i) => (
              <tr key={item.id}>
                <td>{i + 1}</td>
                <td className="text-primary">{item.kode_barang}</td>
                <td>{item.nama_barang}</td>
                <td>{item.satuan}</td>
                <td><strong>{item.stok}</strong></td>
                <td>{item.batas_minimal}</td>
                <td>{item.batas_maksimal}</td>
                <td>
                  <button className="btn btn-success btn-sm me-1">➡</button>
                  <button className="btn btn-primary btn-sm me-1">Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Hapus</button>
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr><td colSpan="8" className="text-center">Tidak ada data.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KelolaBarang;
