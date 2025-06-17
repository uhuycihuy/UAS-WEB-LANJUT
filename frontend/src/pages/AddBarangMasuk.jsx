import React from 'react';
import Sidebar from '../components/Sidebar';
import FormBarangMasuk from '../components/FormBarangMasuk';

const AddBarangMasuk = () => {
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1 p-4">
        <h2 className="mb-3">Tambah Barang Masuk</h2>
        <FormBarangMasuk />
      </div>
    </div>
  );
};

export default AddBarangMasuk;
