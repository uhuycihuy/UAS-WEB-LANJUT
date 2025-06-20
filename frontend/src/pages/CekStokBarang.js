import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axiosInstance';
import Sidebar from '../components/Sidebar';
import { Table, Form, Pagination, Alert, Row, Col } from 'react-bootstrap';

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

  const fetchBarang = useCallback(async () => {
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search
      };

      let endpoint = '/barang';
      if (filter === 'low') {
        endpoint = '/barang/stok-kurang';
      } else if (filter === 'high') {
        endpoint = '/barang/stok-berlebih';
      }

      const res = await axios.get(endpoint, { params });
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
  }, [currentPage, search, filter, itemsPerPage]);


  useEffect(() => {
    fetchBarang();
  }, [fetchBarang]);


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

  const filteredBarang = filter === 'normal'
    ? barang.filter(item => {
        const stok = parseInt(item.stok) || 0;
        const min = parseInt(item.batas_minimal) || 0;
        const max = parseInt(item.batas_maksimal) || 0;
        return stok >= min && stok <= max;
      })
    : barang;

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

        <Row className="mb-3">
          <Col md={8}>
            <Form.Control
              type="text"
              placeholder="Cari berdasarkan nama atau kode barang..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </Col>
          <Col md={3}>
            <Form.Select
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
            </Form.Select>
          </Col>
        </Row>

        {showAlert && (
          <Alert variant="warning" onClose={() => setShowAlert(false)} dismissible>
            {alertMessage}
          </Alert>
        )}

        <Table striped bordered hover>
          <thead>
            <tr className="text-center">
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
            {filteredBarang.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center">Tidak ada data ditemukan</td>
              </tr>
            ) : (
              filteredBarang.map((item, index) => {
                const status = getStatusStok(item.stok, item.batas_minimal, item.batas_maksimal);
                return (
                  <tr key={item.id} className="text-center">
                    <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
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
              })
            )}
          </tbody>
        </Table>

        <div className="d-flex justify-content-between">
          <small>Menampilkan {Math.min(currentPage * itemsPerPage, totalData)} dari {totalData} data</small>
          <Pagination>{renderPagination()}</Pagination>
        </div>
      </div>
    </div>
  );
};

export default CekStokBarang;
