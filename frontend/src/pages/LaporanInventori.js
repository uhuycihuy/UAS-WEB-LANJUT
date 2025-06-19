import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import Sidebar from '../components/Sidebar';

const LaporanInventori = () => {
  const [summary, setSummary] = useState({
    totalBarang: 0,
    totalStok: 0,
    barangMasuk: [],
    barangKeluar: [],
    stokKurang: [],
    stokBerlebih: []
  });

  const [selectedBulan, setSelectedBulan] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [selectedTahun, setSelectedTahun] = useState(String(new Date().getFullYear()));
  const [periode, setPeriode] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setPeriode(`${selectedBulan}/${selectedTahun}`);

    try {
      const response = await axios.get(`/laporan/bulanan/${selectedBulan}/${selectedTahun}`);
      const data = response.data?.data || {};

      console.log("RESPON DATA LAPORAN:", data);

      setSummary({
        totalBarang: data.totalBarang || 0,
        totalStok: data.totalStok || 0,
        barangMasuk: data.barangMasuk || [],
        barangKeluar: data.barangKeluar || [],
        stokKurang: data.stokKurang || [],
        stokBerlebih: data.stokBerlebih || []
      });
    } catch (err) {
      console.error("Gagal mengambil data laporan:", err);
      setSummary({
        totalBarang: 0,
        totalStok: 0,
        barangMasuk: [],
        barangKeluar: [],
        stokKurang: [],
        stokBerlebih: []
      });
      setPeriode('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBulan, selectedTahun]);

  const handleDownloadPDF = async () => {
    try {
      const response = await axios.get(`/laporan/bulanan/${selectedBulan}/${selectedTahun}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laporan_inventory_${selectedBulan}_${selectedTahun}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Gagal mengunduh laporan PDF:", error);
      alert("Gagal mengunduh laporan PDF.");
    }
  };

  const renderTable = (title, items) => (
    <div className="mb-4">
      <h5 className="text-uppercase fw-bold">{title}</h5>
      <table className="table table-bordered">
        <thead className="text-center">
          <tr>
            <th>NO</th>
            <th>KODE</th>
            <th>NAMA BARANG</th>
            <th>JUMLAH</th>
            <th>SATUAN</th>
            <th>TANGGAL</th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? (
            items.map((item, index) => (
              <tr key={item.id || index}>
                <td>{index + 1}</td>
                <td>{item.kode_barang}</td>
                <td>{item.nama_barang}</td>
                <td>{item.jumlah}</td>
                <td>{item.satuan}</td>
                <td>{item.tanggal || '-'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center">
                {loading ? 'Loading...' : 'Tidak ada data'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p><strong>Total {title.toLowerCase()}: {items?.length || 0}</strong></p>
    </div>
  );

  const renderSimpleTable = (title, items) => (
    <div className="mb-4">
      <h5 className="text-uppercase fw-bold">{title}</h5>
      <table className="table table-bordered">
        <thead className="text-center">
          <tr>
            <th>NO</th>
            <th>KODE</th>
            <th>NAMA BARANG</th>
            <th>STOK</th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? (
            items.map((item, index) => (
              <tr key={item.id || index}>
                <td>{index + 1}</td>
                <td>{item.kode_barang}</td>
                <td>{item.nama_barang}</td>
                <td>{item.stok}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center">
                {loading ? 'Loading...' : 'Tidak ada data'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p><strong>Total {title.toLowerCase()}: {items?.length || 0}</strong></p>
    </div>
  );

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1 p-4">
        <h2 className="text-center">LAPORAN INVENTORY BULANAN</h2>

        {/* Form Pilih Periode */}
        <div className="row mb-3 justify-content-center">
          <div className="col-md-3">
            <select 
              className="form-select" 
              value={selectedBulan} 
              onChange={(e) => setSelectedBulan(e.target.value)}
              disabled={loading}
            >
              {[
                'Januari','Februari','Maret','April','Mei','Juni',
                'Juli','Agustus','September','Oktober','November','Desember'
              ].map((bulan, idx) => (
                <option key={idx} value={String(idx + 1).padStart(2, '0')}>
                  {bulan}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <input
              type="number"
              className="form-control"
              min="2000"
              max="2100"
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="col-md-3">
            <button 
              className="btn btn-info w-100" 
              onClick={fetchData}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Lihat Laporan'}
            </button>
          </div>
        </div>

        {periode && (
          <h5 className="text-center mb-4">PERIODE : {periode}</h5>
        )}

        <div className="text-center mb-4">
          <button 
            className="btn btn-primary" 
            onClick={handleDownloadPDF}
            disabled={loading}
          >
            Download PDF
          </button>
        </div>

        {/* Ringkasan */}
        <div className="row mb-5 text-center">
          <div className="col-md-6">
            <div className="card p-3">
              <h6>Total Barang</h6>
              <h3>{loading ? '...' : summary.totalBarang}</h3>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card p-3">
              <h6>Total Stok</h6>
              <h3>{loading ? '...' : summary.totalStok}</h3>
            </div>
          </div>
        </div>

        {/* Tabel Data */}
        {renderTable("Barang Masuk", summary.barangMasuk)}
        {renderTable("Barang Keluar", summary.barangKeluar)}
        {renderSimpleTable("Barang Berlebih", summary.stokBerlebih)}
        {renderSimpleTable("Barang Kurang", summary.stokKurang)}
      </div>
    </div>
  );
};

export default LaporanInventori;
