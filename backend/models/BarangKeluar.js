import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Barang from "./Barang.js";

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
      model: Barang,
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

BarangKeluar.belongsTo(Barang, { foreignKey: "barang_id" });

export default BarangKeluar;
