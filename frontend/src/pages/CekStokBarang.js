import React, { useState, useEffect } from 'react';
import axios from '../api/axiosInstance';
import Sidebar from '../components/Sidebar';
import { Table, Form, Pagination, Alert } from 'react-bootstrap';

const CekStokBarang = () => {
  const [barang, setBarang] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const itemsPerPage = 10;

  const fetchBarang = async () => {
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search,
        filter
      };

      const res = await axios.get('/barang', { params });
      const result = res.data?.data || {};

      setBarang(result.barang || []);
      setTotalPages(result.pagination?.totalPages || 1);
      setTotalData(result.pagination?.total || 0);
      setShowAlert(false);
    } catch (err) {
      console.error('Gagal mengambil data barang:', err);
      setBarang([]);
      setTotalPages(1);
      setTotalData(0);
      setAlertMessage('Gagal mengambil data barang.');
      setShowAlert(true);
    }
  };

  useEffect(() => {
    fetchBarang();
  }, [currentPage, search, filter]);

  const getStatusStok = (stok, min, max) => {
    if (stok < min) return 'Kurang';
    if (stok > max) return 'Berlebih';
    return 'Normal';
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Kurang': return 'badge bg-danger';
      case 'Berlebih': return 'badge bg-warning text-dark';
      case 'Normal': return 'badge bg-success';
      default: return 'badge bg-secondary';
    }
  };

  const renderPagination = () => {
    const items = [];
    for (let i = 1; i <= totalPages; i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </Pagination.Item>
      );
    }
    return items;
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container mt-4">
        <h4 className="fw-bold">Cek Stok Barang</h4>
        <p>Filter dan pantau status stok barang</p>

        <div className="d-flex gap-2 flex-wrap mb-3">
          <Form.Control
            type="text"
            placeholder="Cari berdasarkan nama atau kode barang..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            style={{ maxWidth: '400px' }}
          />
          <Form.Select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{ width: '180px' }}
          >
            <option value="all">Semua Stok</option>
            <option value="low">Stok Kurang</option>
            <option value="high">Stok Berlebih</option>
            <option value="normal">Stok Normal</option>
          </Form.Select>
        </div>

        {showAlert && (
          <Alert variant="warning" onClose={() => setShowAlert(false)} dismissible>
            {alertMessage}
          </Alert>
        )}

        <div className="table-responsive">
          <Table bordered striped hover>
            <thead className="text-center table-light">
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
              {barang.length === 0 ? (
                <tr><td colSpan="8" className="text-center">Tidak ada data.</td></tr>
              ) : (
                barang.map((item, index) => {
                  const status = getStatusStok(item.stok, item.batas_minimal, item.batas_maksimal);
                  return (
                    <tr key={item.id}>
                      <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="text-primary">{item.kode_barang}</td>
                      <td>{item.nama_barang}</td>
                      <td>{item.satuan}</td>
                      <td><strong>{item.stok}</strong></td>
                      <td>{item.batas_minimal}</td>
                      <td>{item.batas_maksimal}</td>
                      <td><span className={getStatusClass(status)}>{status}</span></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </div>

        <div className="d-flex justify-content-between">
          <small>Menampilkan {Math.min(currentPage * itemsPerPage, totalData)} dari {totalData} data</small>
          <Pagination>{renderPagination()}</Pagination>
        </div>
      </div>
    </div>
  );
};

export default CekStokBarang;
