// routes/laporanRoutes.js
import express from "express";
import {
    generateMonthlyInventoryReport,
    generateLaporanBarangMasuk,
    generateLaporanBarangKeluar,
    generateLaporanStok,
    generateLaporanStokKurang,
    generateLaporanStokBerlebih 
} from "../controllers/LaporanController.js";

const router = express.Router();

// Route untuk mencetak keseluruhan laporan 
router.get("/bulanan/:bulan/:tahun", generateMonthlyInventoryReport);

// Routes laporan data satu-satu (ini buat ngetes)
router.get("/barang-masuk/:bulan/:tahun", generateLaporanBarangMasuk); 
router.get("/barang-keluar/:bulan/:tahun", generateLaporanBarangKeluar);
router.get("/stok", generateLaporanStok); 
router.get("/stok-kurang", generateLaporanStokKurang);
router.get("/stok-berlebih", generateLaporanStokBerlebih);

export default router;
