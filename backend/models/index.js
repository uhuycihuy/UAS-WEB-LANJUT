import db from "../config/Database.js";
import Barang from "./Barang.js";
import BarangKeluar from "./BarangKeluar.js";
import BarangMasuk from "./BarangMasuk.js";

// Setup associations di sini setelah semua model diimport
BarangKeluar.belongsTo(Barang, { 
  foreignKey: "barang_id",
  as: "barang" 
});

BarangMasuk.belongsTo(Barang, { 
  foreignKey: "barang_id",
  as: "barang" 
});

Barang.hasMany(BarangKeluar, { 
  foreignKey: "barang_id",
  as: "barang_keluar" 
});

Barang.hasMany(BarangMasuk, { 
  foreignKey: "barang_id",
  as: "barang_masuk" 
});

// Sync database
const syncDatabase = async () => {
  try {
    await db.sync();
    console.log("Database synced successfully");
  } catch (error) {
    console.error("Error syncing database:", error);
  }
};

export {
  Barang,
  BarangKeluar,
  BarangMasuk,
  syncDatabase
};