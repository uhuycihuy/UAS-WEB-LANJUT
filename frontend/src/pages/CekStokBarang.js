import React, { useState, useEffect } from 'react';
import axios from '../api/axiosInstance';
import Sidebar from '../components/Sidebar';

const CekStokBarang = () => {
  const [barang, setBarang] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchBarang();
  }, []);

  const fetchBarang = async () => {
    try {
      const res = await axios.get('/barang');
      const dataArray = res.data?.data?.barang || [];
      setBarang(dataArray);
    } catch (err) {
      console.error('Gagal mengambil data barang:', err);
      setBarang([]);
    }
  };

  const getStatusStok = (stok, min, max) => {
    if (stok < min) return 'Kurang';
    if (stok > max) return 'Berlebih';
    return 'Normal';
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Kurang':
        return 'badge bg-danger';
      case 'Berlebih':
        return 'badge bg-warning text-dark';
      case 'Normal':
        return 'badge bg-success';
      default:
        return 'badge bg-secondary';
    }
  };

  const filteredData = barang.filter(item => {
    const matchSearch =
      item.nama_barang.toLowerCase().includes(search.toLowerCase()) ||
      item.kode_barang.toLowerCase().includes(search.toLowerCase());

    const status = getStatusStok(item.stok, item.batas_minimal, item.batas_maksimal);
    const matchFilter =
      filter === 'all' ||
      (filter === 'low' && status === 'Kurang') ||
      (filter === 'high' && status === 'Berlebih') ||
      (filter === 'normal' && status === 'Normal');

    return matchSearch && matchFilter;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          className={`btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-outline-primary'} mx-1`}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1 p-4">
        <h2 className="mb-4">Cek Stok Barang</h2>

        <div className="d-flex gap-2 flex-wrap mb-4">
          <input
            type="text"
            className="form-control"
            style={{ maxWidth: '500px' }}
            placeholder="Cari berdasarkan nama atau kode barang..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
          <select
            className="form-select w-auto"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">Semua Stok</option>
            <option value="low">Stok Kurang</option>
            <option value="high">Stok Berlebih</option>
            <option value="normal">Stok Normal</option>
          </select>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered table-hover table-striped mb-0">
            <thead className="table-light text-center">
              <tr>
                <th>NO</th>
                <th>KODE</th>
                <th>NAMA</th>
                <th>SATUAN</th>
                <th>STOK</th>
                <th>BATAS MIN</th>
                <th>BATAS MAX</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item, i) => {
                const status = getStatusStok(item.stok, item.batas_minimal, item.batas_maksimal);
                return (
                  <tr key={item.id}>
                    <td>{indexOfFirstItem + i + 1}</td>
                    <td className="text-primary">{item.kode_barang}</td>
                    <td>{item.nama_barang}</td>
                    <td>{item.satuan}</td>
                    <td><strong>{item.stok}</strong></td>
                    <td>{item.batas_minimal}</td>
                    <td>{item.batas_maksimal}</td>
                    <td>
                      <span className={getStatusClass(status)}>{status}</span>
                    </td>
                  </tr>
                );
              })}
              {currentItems.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center">Tidak ada data.</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="d-flex justify-content-between align-items-center mt-3">
            <small>Menampilkan {currentItems.length} dari {filteredData.length} data</small>
            <div>{renderPagination()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CekStokBarang;
