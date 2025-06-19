import React, { useEffect, useState, useCallback } from 'react';
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    const monthNames = [
        "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    setPeriode(`${monthNames[parseInt(selectedBulan)]} ${selectedTahun}`);

    try {
      const response = await axios.get(`/laporan/preview/bulanan/${selectedBulan}/${selectedTahun}`);
      const data = response.data?.data || {};

      console.log("RESPON DATA LAPORAN FRONTEND:", data);

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
  }, [selectedBulan, selectedTahun]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDownloadPDF = async () => {
    try {
      const response = await axios.get(`/laporan/bulanan/${selectedBulan}/${selectedTahun}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laporan_inventory_bulanan_${selectedBulan}_${selectedTahun}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Gagal mengunduh laporan PDF:", error);
      alert("Gagal mengunduh laporan PDF.");
    }
  };

  // Fungsi untuk menghitung total jumlah/stok
  const calculateTotalJumlah = (items) => {
    return items.reduce((total, item) => total + (parseInt(item.jumlah) || 0), 0);
  };

  const calculateTotalStok = (items) => {
    return items.reduce((total, item) => total + (parseInt(item.stok) || 0), 0);
  };

  const renderTable = (title, items) => {
    const totalJumlah = calculateTotalJumlah(items);
    
    return (
      <div className="mb-4">
        <h5 className="text-uppercase fw-bold text-center">{title}</h5>
        <table className="table table-bordered">
          <thead className="text-center">
            <tr>{/* No whitespace between th tags */}
              <th>NO</th><th>KODE BARANG</th><th>NAMA BARANG</th><th>SATUAN</th><th>JUMLAH</th><th>TANGGAL & WAKTU</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item, index) => (
                <tr key={item.id || index}>
                  <td>{index + 1}</td>
                  <td style={{ color: '#1E40AF' }}>{item.kode_barang}</td>
                  <td>{item.nama_barang}</td>
                  <td>{item.satuan}</td>
                  <td>{item.jumlah}</td>
                  <td>{item.tanggal || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center">
                  {loading ? 'Memuat...' : 'Tidak ada data'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="d-flex justify-content-between">
          <p><strong>TOTAL {title.toUpperCase()}: {items?.length || 0}</strong></p>
          <p><strong>TOTAL JUMLAH: {totalJumlah}</strong></p>
        </div>
      </div>
    );
  };

  const renderSimpleTable = (title, items) => {
    const totalStok = calculateTotalStok(items);
    
    return (
      <div className="mb-4">
        <h5 className="text-uppercase fw-bold text-center">{title}</h5>
        <table className="table table-bordered">
          <thead className="text-center">
            <tr>
              <th>NO</th><th>KODE BARANG</th><th>NAMA BARANG</th><th>STOK</th><th>BATAS MINIMAL</th><th>BATAS MAKSIMAL</th><th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item, index) => {
                  let statusColor = '#000000';
                  let statusBgColor = '#FFFFFF';
                  if (item.status === 'Kurang' || item.status === 'Habis') {
                      statusColor = '#721C24';
                      statusBgColor = '#F8D7DA';
                  } else if (item.status === 'Berlebih') {
                      statusColor = '#856404';
                      statusBgColor = '#FFF3CD';
                  } else if (item.status === 'Aman') {
                      statusColor = '#155724';
                      statusBgColor = '#D4EDDA';
                  }

                  const capsuleStyle = {
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '15px',
                      backgroundColor: statusBgColor,
                      color: statusColor,
                      fontWeight: 'bold',
                      fontSize: '0.8em'
                  };

                  return (
                      <tr key={item.id || index}>
                          <td>{index + 1}</td>
                          <td style={{ color: '#1E40AF' }}>{item.kode_barang}</td>
                          <td>{item.nama_barang}</td>
                          <td>{item.stok}</td>
                          <td>{item.batas_minimal !== undefined ? item.batas_minimal : '-'}</td>
                          <td>{item.batas_maksimal !== undefined ? item.batas_maksimal : '-'}</td>
                          <td>
                              <span style={capsuleStyle}>{item.status}</span>
                          </td>
                      </tr>
                  );
              })
            ) : (
              <tr>
                <td colSpan="7" className="text-center">
                  {loading ? 'Memuat...' : 'Tidak ada data'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="d-flex justify-content-between">
          <p><strong>TOTAL {title.toUpperCase()}: {items?.length || 0}</strong></p>
          <p><strong>TOTAL STOK: {totalStok}</strong></p>
        </div>
      </div>
    );
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1 p-4">
        <h2 className="text-center">LAPORAN INVENTORY BULANAN</h2>

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
            Unduh PDF
          </button>
        </div>

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

        {renderTable("Barang Masuk", summary.barangMasuk)}
        {renderTable("Barang Keluar", summary.barangKeluar)}
        {renderSimpleTable("Barang Berlebih", summary.stokBerlebih)}
        {renderSimpleTable("Barang Kurang", summary.stokKurang)}
      </div>
    </div>
  );
};

export default LaporanInventori;