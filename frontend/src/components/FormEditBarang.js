import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance';
import Sidebar from '../components/Sidebar';

const FormEditBarang = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nama_barang: '',
    satuan: '',
    stok: 0,
    batas_minimal: 0,
    batas_maksimal: 0,
  });

  useEffect(() => {
    const fetchBarang = async () => {
      try {
        const res = await axios.get(`/barang/${id}`);
        const barang = res.data?.data;

        if (barang) {
          setFormData({
            nama_barang: barang.nama_barang,
            satuan: barang.satuan,
            stok: barang.stok,
            batas_minimal: barang.batas_minimal,
            batas_maksimal: barang.batas_maksimal,
          });
        } else {
          alert('Barang tidak ditemukan.');
          navigate('/kelola-barang');
        }
      } catch (err) {
        console.error(err);
        alert('Gagal mengambil data barang.');
        navigate('/kelola-barang');
      }
    };

    fetchBarang();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['stok', 'batas_minimal', 'batas_maksimal'].includes(name) ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/barang/${id}`, formData);
      alert('Barang berhasil diperbarui.');
      navigate('/kelola-barang');
    } catch (err) {
      console.error('Gagal menambahkan barang baru:', err.response?.data?.message || err.message);
      alert(`Gagal menambahkan barang baru: ${err.response?.data?.message || 'Terjadi kesalahan'}.`);
    }
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1 p-4">
        <h2>Edit Barang</h2>
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
            <input
              type="text"
              className="form-control"
              id="satuan"
              name="satuan"
              value={formData.satuan}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="stok" className="form-label">Stok</label>
            <input
              type="number"
              className="form-control"
              id="stok"
              name="stok"
              value={formData.stok}
              onChange={handleChange}
              min="0"
              required
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
              min="0"
              required
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
              min="0"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary me-2">Simpan</button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/kelola-barang')}>Batal</button>
        </form>
      </div>
    </div>
  );
};

export default FormEditBarang;
