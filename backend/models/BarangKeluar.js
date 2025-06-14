import { Sequelize } from "sequelize";
import db from "../config/Database.js";
// Hapus import Barang untuk menghindari circular dependency
// import Barang from "./Barang.js";

const { DataTypes } = Sequelize;

const BarangKeluar = db.define("barang_keluar", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  barang_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "barang", // Gunakan nama tabel sebagai string
      key: "id",
    },
  },
  jumlah: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tanggal: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
}, {
  freezeTableName: true,
  timestamps: false,
});

// Pindahkan association ke file terpisah atau ke index.js
// BarangKeluar.belongsTo(Barang, { foreignKey: "barang_id" });

export default BarangKeluar;