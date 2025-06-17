import React from 'react';
import moment from 'moment';

const TabelBarangMasuk = ({ data }) => {
  return (
    <div className="table-responsive">
      <table className="table table-bordered mt-3">
        <thead className="table-light">
          <tr>
            <th>NO</th>
            <th>KODE BARANG</th>
            <th>NAMA BARANG</th>
            <th>SATUAN</th>
            <th>JUMLAH</th>
            <th>TANGGAL & WAKTU MASUK</th>
            <th>BATAS MAKSIMAL</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan="7" className="text-center">Belum ada data</td></tr>
          ) : (
            data.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td><a href="#">{item.barang.kode_barang}</a></td>
                <td>{item.barang.nama_barang}</td>
                <td>{item.barang.satuan}</td>
                <td className="fw-bold">{item.jumlah}</td>
                <td>{moment(item.tanggal).format("DD-MM-YYYY HH:mm:ss")}</td>
                <td>{item.barang.batas_maksimal}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <p>Menampilkan {data.length} dari {data.length} data</p>
    </div>
  );
};

export default TabelBarangMasuk;
