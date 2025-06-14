import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import BarangKeluar from "./BarangKeluar.js";
import BarangMasuk from "./BarangMasuk.js";

const { DataTypes } = Sequelize;

const Barang = db.define('barang', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  kode_barang: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  nama_barang: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  satuan: {
    type: DataTypes.STRING(20),
    defaultValue: "Unit"
  },
  stok: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  batas_minimal: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  batas_maksimal: {
    type: DataTypes.INTEGER,
    defaultValue: 9999
  }
}, {
  freezeTableName: true,
  timestamps: false
});

Barang.hasMany(BarangMasuk, { foreignKey: "barang_id" });
Barang.hasMany(BarangKeluar, { foreignKey: "barang_id" });

export default Barang;
