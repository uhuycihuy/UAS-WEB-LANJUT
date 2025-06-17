// src/components/FormBarangKeluar.jsx
import React, { useState, useEffect } from 'react';
import axios from '../api/axiosInstance'; // Pastikan path ini benar
import { useNavigate, useParams } from 'react-router-dom'; // Import useParams untuk mengambil ID dari URL
import Sidebar from './Sidebar'; // Asumsi komponen Sidebar ada di path ini

const FormBarangKeluar = () => {
    const { id } = useParams(); // Mengambil ID barang dari URL (e.g., /barang-keluar/form/123 -> id = 123)
    const navigate = useNavigate();

    const [barang, setBarang] = useState(null); // State untuk menyimpan detail barang
    const [jumlahKeluar, setJumlahKeluar] = useState(''); // State untuk jumlah barang yang akan dikeluarkan
    const [error, setError] = useState(''); // State untuk pesan error

    // Effect untuk mengambil detail barang berdasarkan ID
    useEffect(() => {
        const fetchBarangDetail = async () => {
            if (!id) return; // Jangan fetch jika ID tidak ada

            try {
                // Panggil API untuk mendapatkan detail barang
                const res = await axios.get(`http://localhost:3001/api/barang/${id}`);
                setBarang(res.data.data); // Asumsi data barang ada di res.data.data
                setError(''); // Reset error jika berhasil
            } catch (err) {
                console.error('Gagal mengambil detail barang:', err);
                setError('Gagal memuat detail barang. Silakan coba lagi.');
                setBarang(null); // Pastikan barang null jika ada error
            }
        };

        fetchBarangDetail();
    }, [id]); // Effect ini akan berjalan setiap kali 'id' di URL berubah

    // Handler ketika form disubmit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Reset pesan error

        if (!barang) {
            setError('Detail barang belum dimuat. Mohon tunggu atau coba muat ulang.');
            return;
        }

        const jumlah = parseInt(jumlahKeluar);

        // Validasi input jumlah
        if (isNaN(jumlah) || jumlah <= 0) {
            setError('Jumlah keluar harus berupa angka positif.');
            return;
        }

        // Validasi stok
        if (jumlah > barang.stok) {
            setError(`Stok tidak mencukupi. Stok tersedia: ${barang.stok}.`);
            return;
        }

        try {
            // Kirim data transaksi barang keluar ke backend
            await axios.post('http://localhost:3001/api/barang-keluar', {
                barang_id: id,
                jumlah: jumlah,
            });

            alert('Barang berhasil dikeluarkan dan stok diperbarui!');
            navigate('/barang-keluar'); // Arahkan ke halaman daftar barang keluar setelah sukses
        } catch (err) {
            console.error('Gagal mencatat barang keluar:', err.response?.data?.message || err.message);
            setError(`Gagal mencatat barang keluar: ${err.response?.data?.message || 'Terjadi kesalahan.'}`);
        }
    };

    // Tampilkan loading state atau error jika detail barang belum dimuat
    if (error && !barang) {
        return (
            <div className="d-flex">
                <Sidebar />
                <div className="flex-grow-1 p-4">
                    <h2 className="text-danger">Terjadi Kesalahan</h2>
                    <p>{error}</p>
                    <button className="btn btn-secondary" onClick={() => navigate('/kelola-barang')}>Kembali ke Kelola Barang</button>
                </div>
            </div>
        );
    }

    if (!barang) {
        return (
            <div className="d-flex">
                <Sidebar />
                <div className="flex-grow-1 p-4">
                    <h2>Memuat Detail Barang...</h2>
                    <p>Mohon tunggu sebentar.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="d-flex">
            <Sidebar />
            <div className="flex-grow-1 p-4">
                <h2>Keluar Barang: {barang.nama_barang} ({barang.kode_barang})</h2>
                {error && <div className="alert alert-danger">{error}</div>} {/* Tampilkan alert error */}
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Nama Barang</label>
                        <input
                            type="text"
                            className="form-control"
                            value={barang.nama_barang}
                            readOnly // Tidak bisa diedit
                            disabled // Tidak bisa berinteraksi
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Stok Tersedia</label>
                        <input
                            type="text"
                            className="form-control"
                            value={barang.stok}
                            readOnly
                            disabled
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="jumlahKeluar" className="form-label">Jumlah Keluar</label>
                        <input
                            type="number"
                            className="form-control"
                            id="jumlahKeluar"
                            name="jumlahKeluar"
                            value={jumlahKeluar}
                            onChange={(e) => setJumlahKeluar(e.target.value)}
                            required
                            min="1" // Minimal 1 barang keluar
                            max={barang.stok} // Maksimal sesuai stok yang tersedia
                        />
                    </div>
                    <button type="submit" className="btn btn-danger me-2">Catat Barang Keluar</button>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/kelola-barang')}>Batal</button>
                </form>
            </div>
        </div>
    );
};

export default FormBarangKeluar;