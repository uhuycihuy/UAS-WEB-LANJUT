import express from "express";
import {
    getAllBarangKeluar,
    getBarangKeluarById,
    createBarangKeluar,
    updateBarangKeluar,
    deleteBarangKeluar,
    getBarangKeluarSummary,
    cekStokSebelumKeluar
} from "../controllers/BarangKeluarController.js";

const router = express.Router();

// GET /api/barang-keluar - Lihat semua transaksi barang keluar
router.get("/", getAllBarangKeluar);

// GET /api/barang-keluar/summary - Lihat ringkasan barang keluar
router.get("/summary", getBarangKeluarSummary);

// GET /api/barang-keluar/cek-stok/:kodeBarang - Cek stok sebelum barang keluar
router.get("/cek-stok/:kodeBarang", cekStokSebelumKeluar);

// GET /api/barang-keluar/:id - Lihat transaksi barang keluar berdasarkan ID
router.get("/:id", getBarangKeluarById);

// POST /api/barang-keluar - Catat barang keluar baru
router.post("/", createBarangKeluar);

// PUT /api/barang-keluar/:id - Update data barang keluar
router.put("/:id", updateBarangKeluar);

// DELETE /api/barang-keluar/:id - Hapus data barang keluar
router.delete("/:id", deleteBarangKeluar);

export default router;