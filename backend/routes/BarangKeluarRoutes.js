import express from "express";
import {
    getAllBarangKeluar,
    getBarangKeluarById,
    createBarangKeluar,
    getBarangKeluarSummary,
} from "../controllers/BarangKeluarController.js";

const router = express.Router();

// GET /api/barang-keluar - Lihat semua transaksi barang keluar
router.get("/", getAllBarangKeluar);

// GET /api/barang-keluar/summary - Lihat ringkasan barang keluar
router.get("/summary/:bulan/:tahun", getBarangKeluarSummary);

// GET /api/barang-keluar/:id - Lihat transaksi barang keluar berdasarkan ID
router.get("/:id", getBarangKeluarById);

// POST /api/barang-keluar - Catat barang keluar baru
router.post("/", createBarangKeluar);

export default router;