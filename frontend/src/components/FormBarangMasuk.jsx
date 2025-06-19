// src/components/FormTambahBarang.jsx
import React, { useState } from 'react';
import axios from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
// import Sidebar from './Sidebar';

const FormBarangMasuk = () => {
    const [formData, setFormData] = useState({
        nama_barang: '',
        jumlah_masuk: '',
        satuan: 'Unit', 
        batas_minimal: '', 
        batas_maksimal: '', 
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Konversi nilai ke angka untuk batas_minimal, batas_maksimal, dan jumlah_masuk
        // Jika nilai kosong (''), simpan sebagai string kosong.
        // Jika tidak kosong, parse sebagai integer.
        if (name === 'jumlah_masuk' || name === 'batas_minimal' || name === 'batas_maksimal') {
            setFormData({
                ...formData,
                [name]: value === '' ? '' : parseInt(value) >= 0 ? parseInt(value) : 0,
            });
        } else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Siapkan data yang akan dikirim, gunakan nilai default backend jika input kosong untuk yang tidak diisi
            const dataToSubmit = {
                nama_barang: formData.nama_barang,
                jumlah_masuk: formData.jumlah_masuk === '' ? 0 : parseInt(formData.jumlah_masuk),
                satuan: formData.satuan, // Menggunakan nilai dari state, yang defaultnya 'Unit' atau input user
                batas_minimal: formData.batas_minimal === '' ? 0 : parseInt(formData.batas_minimal),
                batas_maksimal: formData.batas_maksimal === '' ? 9999 : parseInt(formData.batas_maksimal),
            };

            await axios.post('http://localhost:3001/api/barang', dataToSubmit);
            alert('Barang baru berhasil ditambahkan dan stok awal serta batas tercatat!');
            navigate('/kelola-barang');
        } catch (err) {
            console.error('Gagal menambahkan barang baru:', err.response?.data?.message || err.message);
            alert(`Gagal menambahkan barang baru: ${err.response?.data?.message || 'Terjadi kesalahan'}.`);
        }
    };

    return (
        <div className="d-flex">
            <div className="flex-grow-1 p-4">
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="nama_barang" className="form-label">Nama Barang</label>
                        <input
                            type="text"
                            className="form-control"
                            id="nama_barang"
                            name="nama_barang"
                            value={formData.nama_barang}
                            onChange={handleChange}
                            required
                        />
                    </div>
                        <div className="mb-3">
                        <label htmlFor="satuan" className="form-label">Satuan</label>
                        <select
                            className="form-select"
                            id="satuan"
                            name="satuan"
                            value={formData.satuan}
                            onChange={handleChange}
                            required
                        >
                            <option value="Unit">Unit</option>
                            <option value="Pcs">Pcs</option>
                            <option value="Box">Box</option>
                        </select>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="jumlah_masuk" className="form-label">Jumlah Stok Awal</label>
                        <input
                            type="number"
                            className="form-control"
                            id="jumlah_masuk"
                            name="jumlah_masuk"
                            value={formData.jumlah_masuk}
                            onChange={handleChange}
                            required
                            min="0"
                            placeholder="Masukkan jumlah awal"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="batas_minimal" className="form-label">Batas Minimal Stok</label>
                        <input
                            type="number"
                            className="form-control"
                            id="batas_minimal"
                            name="batas_minimal"
                            value={formData.batas_minimal}
                            onChange={handleChange}
                            required
                            min="0"
                            placeholder="Contoh: 10"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="batas_maksimal" className="form-label">Batas Maksimal Stok</label>
                        <input
                            type="number"
                            className="form-control"
                            id="batas_maksimal"
                            name="batas_maksimal"
                            value={formData.batas_maksimal}
                            onChange={handleChange}
                            required
                            min="0"
                            placeholder="Contoh: 100"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary me-2">Simpan Barang</button>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/kelola-barang')}>Batal</button>
                </form>
            </div>
        </div>
    );
};

export default FormBarangMasuk;