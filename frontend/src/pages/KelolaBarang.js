import React, { useState, useEffect } from 'react';
import axios from '../api/axiosInstance';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';

const KelolaBarang = () => {
    const [barang, setBarang] = useState([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const navigate = useNavigate();

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

    const handleTambahBarangClick = () => {
        navigate('/tambah-barang');
    };

    const handleEditClick = (id) => {
        navigate(`/edit-barang/${id}`);
    };

    const handleBarangKeluarClick = (id) => {
        navigate(`/barang-keluar/form/${id}`);
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
                    <button className="btn btn-primary" onClick={handleTambahBarangClick}>
                        + Tambah Barang
                    </button>
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
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">Semua Stok</option>
                        <option value="low">Stok Kurang</option>
                        <option value="high">Stok Berlebih</option>
                    </select>
                </div>

                <table className="table table-bordered table-striped">
                    <thead className="table-light">
                        <tr className="text-center">
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
                                    <button className="btn btn-primary btn-sm me-1" onClick={() => handleEditClick(item.id)}>Edit</button>
                                    <button className="btn btn-danger btn-sm me-1" onClick={() => handleDelete(item.id)}>Hapus</button>
                                    <button
                                        className="btn btn-success btn-sm"
                                        onClick={() => handleBarangKeluarClick(item.id)}
                                        disabled={item.stok <= 0}
                                        title={item.stok <= 0 ? "Stok habis" : "Keluarkan Barang"}
                                    >
                                        Keluar
                                    </button>
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
