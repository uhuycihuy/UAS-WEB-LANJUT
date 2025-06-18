import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import Sidebar from '../components/Sidebar';

const DashboardAdmin = () => {
  const [summary, setSummary] = useState({
    totalBarang: 0,
    barangMasuk: 0,
    barangKeluar: 0,
    stokKurang: [],
    stokBerlebih: []
  });

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date();
      const bulan = String(today.getMonth() + 1).padStart(2, '0');
      const tahun = today.getFullYear();

      try {
        const [summaryBarang, masuk, keluar, kurang, lebih] = await Promise.all([
          axios.get('/barang/summary'),
          axios.get(`/barang-masuk/summary/${bulan}/${tahun}`),
          axios.get(`/barang-keluar/summary/${bulan}/${tahun}`),
          axios.get('/barang/stok-kurang'),
          axios.get('/barang/stok-berlebih')
        ]);

        setSummary({
          totalBarang: summaryBarang.data?.data?.total_barang || 0,
          barangMasuk: masuk.data?.data?.total_jumlah || 0,
          barangKeluar: keluar.data?.data?.total_jumlah || 0,
          stokKurang: Array.isArray(kurang.data?.data?.barang) ? kurang.data.data.barang : [],
          stokBerlebih: Array.isArray(lebih.data?.data?.barang) ? lebih.data.data.barang : []
        });
      } catch (err) {
        console.error('Gagal memuat data dashboard:', err);
      }
    };

    fetchData();
  }, []);

  const renderTable = (title, items) => {
    if (!Array.isArray(items)) {
      console.warn(`${title} - items is not array`, items);
      return (
        <div className="col-md-6">
          <h5>{title}</h5>
          <div className="alert alert-warning">Data tidak valid</div>
        </div>
      );
    }

    return (
      <div className="col-md-6">
        <h5>{title}</h5>
        <table className="table table-bordered table-striped">
          <thead>
            <tr className="text-center">
              <th>NO</th>
              <th>KODE BARANG</th>
              <th>NAMA BARANG</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item, i) => (
                <tr key={item.id || i}>
                  <td>{i + 1}</td>
                  <td className="text-primary">{item.kode_barang}</td>
                  <td>{item.nama_barang}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="3">Tidak ada data.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1 p-4">
        <h2>Dashboard Admin</h2>
        <p>Selamat Datang</p>
        <div className="row text-center mb-4">
          <div className="col-md-4">
            <div className="card bg-light p-3">
              <h6>Total Barang</h6>
              <h2>{summary.totalBarang}</h2>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card bg-success text-white p-3">
              <h6>Barang Masuk Bulan Ini</h6>
              <h2>{summary.barangMasuk}</h2>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card bg-danger text-white p-3">
              <h6>Barang Keluar Bulan Ini</h6>
              <h2>{summary.barangKeluar}</h2>
            </div>
          </div>
        </div>

        <div className="row">
          {renderTable('5 Barang Stok Kurang', summary.stokKurang)}
          {renderTable('5 Barang Stok Berlebih', summary.stokBerlebih)}
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;
