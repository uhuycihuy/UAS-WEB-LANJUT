import express from "express";
import {
    getAllBarang,
    getBarangById,
    createBarang,
    updateBarang,
    deleteBarang,
    getBarangStokBerlebih,
    getBarangStokKurang,
    getBarangSummary,
    updateStokBarang
} from "../controllers/BarangController.js"

const router = express.Router();

// GET /api/barang/summary - Ringkasan data barang (harus diatas :id)
router.get('/summary', getBarangSummary);

// GET /api/barang/stok-kurang - Barang dengan stok kurang dari batas minimal
router.get('/stok-kurang', getBarangStokKurang);

// GET /api/barang/stok-berlebih - Barang dengan stok melebihi batas maksimal
router.get('/stok-berlebih', getBarangStokBerlebih);

// GET /api/barang - Lihat semua barang (dengan pagination dan search)
router.get('/', getAllBarang);

// GET /api/barang/:id - Lihat detail barang berdasarkan ID
router.get('/:id', getBarangById);

// POST /api/barang - Tambah barang baru
router.post('/', createBarang);

// PUT /api/barang/:id - Update data barang
router.put('/:id', updateBarang);

// PUT /api/barang/:id/stok - Update stok barang (untuk internal use)
router.put('/:id/stok', updateStokBarang);

// DELETE /api/barang/:id - Hapus barang
router.delete('/:id', deleteBarang);

export default router;