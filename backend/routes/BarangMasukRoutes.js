import express from "express";
import {
    getAllBarangMasuk,
    getBarangMasukById,
    createBarangMasuk,
    updateBarangMasuk,
    deleteBarangMasuk,
    getBarangMasukSummary
} from "../controllers/BarangMasukController.js";

const router = express.Router();

// GET /api/barang-masuk - Lihat semua transaksi barang masuk
router.get("/", getAllBarangMasuk);

// GET /api/barang-masuk/summary - Lihat ringkasan barang masuk
router.get("/summary", getBarangMasukSummary);

// GET /api/barang-masuk/:id - Lihat transaksi barang masuk berdasarkan ID
router.get("/:id", getBarangMasukById);

// POST /api/barang-masuk - Catat barang masuk baru
router.post("/", createBarangMasuk);

// PUT /api/barang-masuk/:id - Update data barang masuk
router.put("/:id", updateBarangMasuk);

// DELETE /api/barang-masuk/:id - Hapus data barang masuk
router.delete("/:id", deleteBarangMasuk);

export default router;