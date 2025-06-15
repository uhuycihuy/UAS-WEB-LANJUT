import express from "express";
import {
    getAllBarangMasuk,
    getBarangMasukById,
    getBarangMasukSummary
} from "../controllers/BarangMasukController.js";

const router = express.Router();

// GET /api/barang-masuk - Lihat semua transaksi barang masuk
router.get("/", getAllBarangMasuk);

// GET /api/barang-masuk/summary - Lihat ringkasan barang masuk
router.get('/summary/:bulan/:tahun', getBarangMasukSummary);

// GET /api/barang-masuk/:id - Lihat transaksi barang masuk berdasarkan ID
router.get("/:id", getBarangMasukById);

export default router;