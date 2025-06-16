import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

const BarangMasuk = db.define("barang_masuk", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  barang_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "barang", 
      key: "id",
    },
  },
  jumlah: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tanggal: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  freezeTableName: true,
  timestamps: false,
});

export default BarangMasuk;