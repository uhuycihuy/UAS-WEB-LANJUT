// src/pages/BarangKeluar.jsx
import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import { Table, Form, Button, Pagination, Row, Col, Alert } from 'react-bootstrap';
import { format } from 'date-fns';
import Sidebar from '../components/Sidebar';

const BarangKeluar = () => {
    const [barangKeluar, setBarangKeluar] = useState([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalData, setTotalData] = useState(0); 
    const [totalPages, setTotalPages] = useState(1);

    // State untuk filter bulan dan tahun, disesuaikan dengan backend
    const [selectedMonth, setSelectedMonth] = useState(''); // '' untuk "Semua Bulan", '1' sampai '12'
    const [selectedYear, setSelectedYear] = useState('');  // '' untuk "Semua Tahun" atau tahun spesifik

    // State untuk kontrol tampilan Alert
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    const limit = 10;

    const fetchBarangKeluar = async (currentSearch = '', currentPage = 1, currentMonth = '', currentYear = '') => {
        try {
            const params = {
                search: currentSearch,
                page: currentPage,
                limit: 10,
            };

            // Tambahkan parameter bulan dan tahun sesuai logika backend
            if (currentMonth && currentMonth !== 'all') { // Kirim 'bulan' jika bukan 'all'
                params.bulan = currentMonth;
            }
            if (currentYear) { // Kirim 'tahun' jika ada
                params.tahun = currentYear;
            }

            // Endpoint backend Anda adalah 'http://localhost:3001/api/barang-keluar'
            const res = await axios.get('http://localhost:3001/api/barang-keluar', { params });
            
            const allData = res.data?.data || {};
            setBarangKeluar(res.data.data.barang_keluar || []);
            setTotalPages(res.data.data.pagination.totalPages || 1);
            setTotalData(allData.pagination?.total || 0);
            setShowAlert(false); // Sembunyikan alert jika fetch berhasil
        } catch (err) {
            console.error('Gagal ambil data barang keluar:', err);
            setBarangKeluar([]);
            setTotalPages(1);
            setTotalData(0);
            setAlertMessage('Gagal mengambil data barang keluar.');
            setShowAlert(true);
        }
    };

    // useEffect utama untuk mengambil data berdasarkan perubahan state filter
    useEffect(() => {
        // Panggil fetchBarangKeluar dengan nilai state saat ini
        fetchBarangKeluar(search, page, selectedMonth, selectedYear);
    }, [page, search, selectedMonth, selectedYear]); // Dependencies yang memicu pengambilan data

    const handleFilterSubmit = () => {
        // Validasi: Jika tahun diisi tapi bulan tidak dipilih (bukan 'all' atau kosong)
        if (selectedYear && !selectedMonth) {
            setAlertMessage('Harap pilih bulan jika Anda memasukkan tahun.');
            setShowAlert(true);
            return;
        }
        
        // Validasi: Jika bulan dipilih tanpa tahun
        if (selectedMonth && !selectedYear && selectedMonth !== 'all') {
            setAlertMessage('Harap masukkan tahun jika Anda memilih bulan.');
            setShowAlert(true);
            return;
        }

        // Reset halaman ke 1 saat filter baru diterapkan
        setPage(1);
        // fetchBarangKeluar akan otomatis terpanggil karena perubahan `selectedMonth` atau `selectedYear` sudah menjadi dependencies `useEffect`
    };

    const handleResetFilter = () => {
        setSearch('');
        setSelectedMonth(''); // Reset bulan ke default (kosong/semua)
        setSelectedYear('');  // Reset tahun ke default (kosong/semua)
        setPage(1);
        setShowAlert(false); // Sembunyikan alert
        setAlertMessage('');
    };

    const renderPagination = () => {
        let items = [];
        for (let i = 1; i <= totalPages; i++) {
            items.push(
                <Pagination.Item key={i} active={i === page} onClick={() => setPage(i)}>
                    {i}
                </Pagination.Item>
            );
        }
        return items;
    };

    // Data bulan untuk dropdown
    const months = [
        { value: '', label: '-- Pilih Bulan --' }, // Default: Tidak ada filter bulan
        { value: 'all', label: 'Semua Bulan' },    // Backend Anda tidak menggunakan 'all' secara eksplisit, tapi ini bisa jadi opsi UX
        { value: '1', label: 'Januari' },
        { value: '2', label: 'Februari' },
        { value: '3', label: 'Maret' },
        { value: '4', label: 'April' },
        { value: '5', label: 'Mei' },
        { value: '6', label: 'Juni' },
        { value: '7', label: 'Juli' },
        { value: '8', label: 'Agustus' },
        { value: '9', label: 'September' },
        { value: '10', label: 'Oktober' },
        { value: '11', label: 'November' },
        { value: '12', label: 'Desember' },
    ];

    // Buat daftar tahun dinamis (misalnya, 5 tahun ke belakang dan 1 tahun ke depan dari tahun saat ini)
    const currentYear = new Date().getFullYear();
    const years = ['']; // Opsi default kosong untuk "Semua Tahun"
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
        years.push(String(i));
    }

    return (
        <div className="d-flex">
            <Sidebar />
            <div className="container mt-4">
                <h4 className="fw-bold">Data Barang Keluar</h4>
                <p>Manajemen data inventori barang keluar</p>

                <Row className="mb-3">
                    <Col md={4}>
                        <Form.Control
                            type="text"
                            placeholder="Cari berdasarkan nama atau kode barang..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1); // Reset halaman saat mencari
                            }}
                        />
                    </Col>
                    {/* Input untuk Bulan */}
                    <Col md={3}>
                        <Form.Select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        >
                            {months.map(month => (
                                <option key={month.value} value={month.value}>{month.label}</option>
                            ))}
                        </Form.Select>
                    </Col>
                    {/* Input untuk Tahun */}
                    <Col md={3}>
                        <Form.Select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                        >
                            <option value="">-- Pilih Tahun --</option>
                            {years.map(year => (
                                <option key={year} value={year}>{year || 'Semua Tahun'}</option>
                            ))}
                        </Form.Select>
                    </Col>
                    <Col md={2}>
                        <div className="d-flex gap-2">
                            <Button variant="primary" onClick={handleFilterSubmit}>Filter</Button>
                            <Button variant="secondary" onClick={handleResetFilter}>Reset</Button>
                        </div>
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
                            <th>KODE BARANG</th>
                            <th>NAMA BARANG</th>
                            <th>SATUAN</th>
                            <th>JUMLAH KELUAR</th>
                            <th>TANGGAL & WAKTU KELUAR</th>
                        </tr>
                    </thead>
                    <tbody>
                        {barangKeluar.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center">Tidak ada data ditemukan</td>
                            </tr>
                        ) : (
                            barangKeluar.map((item, index) => (
                                <tr key={item.id} className="text-center">
                                    <td>{(page - 1) * 10 + index + 1}</td>
                                    <td className="text-primary">{item.barang.kode_barang}</td>
                                    <td>{item.barang.nama_barang}</td>
                                    <td>{item.barang.satuan}</td>
                                    <td>{item.jumlah}</td> 
                                    <td>{format(new Date(item.tanggal), 'dd-MM-yyyy HH:mm:ss')}</td>
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

export default BarangKeluar;