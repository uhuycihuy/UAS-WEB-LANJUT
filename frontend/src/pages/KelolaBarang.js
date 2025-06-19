import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axiosInstance';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import { Table, Form, Button, Pagination, Alert } from 'react-bootstrap';

const KelolaBarang = () => {
    const [barang, setBarang] = useState([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalData, setTotalData] = useState(0); // ✅ Tambahkan ini
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const navigate = useNavigate();
    const limit = 10;

    const fetchBarang = useCallback(async () => {
        try {
            const params = {
            search,
            page,
            limit
            };
            const res = await axios.get('/barang', { params });
            const allData = res.data?.data || {};
            let items = allData.barang || [];

            if (filter === 'low') {
            items = items.filter(item => item.stok < item.batas_minimal);
            } else if (filter === 'high') {
            items = items.filter(item => item.stok > item.batas_maksimal);
            }

            setBarang(items);
            setTotalPages(allData.pagination?.totalPages || 1);
            setTotalData(allData.pagination?.total || 0); // jangan lupa ini
            setShowAlert(false);
        } catch (err) {
            console.error('Gagal mengambil data barang:', err);
            setBarang([]);
            setTotalPages(1);
            setTotalData(0); 
            setAlertMessage('Gagal memuat data barang.');
            setShowAlert(true);
        }
    }, [search, page, filter]);


  useEffect(() => {
    fetchBarang();
  }, [fetchBarang]);

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus barang ini?')) {
      try {
        await axios.delete(`/barang/${id}`);
        fetchBarang();
      } catch (err) {
        console.error('Gagal menghapus:', err);
        alert('Gagal menghapus barang.');
      }
    }
  };

  const handleTambahBarangClick = () => navigate('/tambah-barang');
  const handleEditClick = (id) => navigate(`/edit-barang/${id}`);
  const handleBarangKeluarClick = (id) => navigate(`/barang-keluar/form/${id}`);

  const renderPagination = () => {
    const items = [];
    for (let i = 1; i <= totalPages; i++) {
      items.push(
        <Pagination.Item key={i} active={i === page} onClick={() => setPage(i)}>
          {i}
        </Pagination.Item>
      );
    }
    return items;
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1 p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2>Kelola Data Barang</h2>
          <Button variant="primary" onClick={handleTambahBarangClick}>+ Tambah Barang</Button>
        </div>

        <div className="d-flex mb-3">
          <Form.Control
            type="text"
            placeholder="Cari berdasarkan nama atau kode barang..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="me-2"
          />
          <Form.Select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            className="w-auto"
          >
            <option value="all">Semua Stok</option>
            <option value="low">Stok Kurang</option>
            <option value="high">Stok Berlebih</option>
          </Form.Select>
        </div>

        {showAlert && (
          <Alert variant="danger" onClose={() => setShowAlert(false)} dismissible>
            {alertMessage}
          </Alert>
        )}

        <Table bordered striped hover>
          <thead className="table-light text-center">
            <tr>
              <th>NO</th>
              <th>KODE</th>
              <th>NAMA</th>
              <th>SATUAN</th>
              <th>STOK</th>
              <th>BATAS MIN</th>
              <th>BATAS MAX</th>
              <th>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {barang.length === 0 ? (
              <tr><td colSpan="8" className="text-center">Tidak ada data ditemukan</td></tr>
            ) : (
              barang.map((item, index) => (
                <tr key={item.id} className="text-center">
                  <td>{(page - 1) * 10 + index + 1}</td>
                  <td className="text-primary">{item.kode_barang}</td>
                  <td>{item.nama_barang}</td>
                  <td>{item.satuan}</td>
                  <td><strong>{item.stok}</strong></td>
                  <td>{item.batas_minimal}</td>
                  <td>{item.batas_maksimal}</td>
                  <td>
                    <Button variant="primary" size="sm" className="me-1" onClick={() => handleEditClick(item.id)}>Edit</Button>
                    <Button variant="danger" size="sm" className="me-1" onClick={() => handleDelete(item.id)}>Hapus</Button>
                    <Button
                      variant="success"
                      size="sm"
                      disabled={item.stok <= 0}
                      onClick={() => handleBarangKeluarClick(item.id)}
                      title={item.stok <= 0 ? "Stok habis" : "Keluarkan Barang"}
                    >
                      Keluar
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>

        <div className="d-flex justify-content-between">
          <small>Menampilkan {Math.min(page * limit, totalData)} dari {totalData} data</small>
          <Pagination>{renderPagination()}</Pagination>
        </div>
      </div>
    </div>
  );
};

export default KelolaBarang;
