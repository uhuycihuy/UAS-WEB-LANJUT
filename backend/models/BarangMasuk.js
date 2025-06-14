import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Barang from "./Barang.js";

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

BarangMasuk.belongsTo(Barang, { foreignKey: "barang_id" });

export default BarangMasuk;
