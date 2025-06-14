import Barang from "../models/Barang.js";
import BarangMasuk from "../models/BarangMasuk.js";
import BarangKeluar from "../models/BarangKeluar.js";
import { Op } from "sequelize";

// Helper function untuk generate kode barang dari nama
const generateKodeBarang = (namaBarang) => {
    // Ambil 3 huruf pertama dari setiap kata, hapus spasi dan karakter khusus
    const words = namaBarang.toUpperCase().replace(/[^A-Z0-9\s]/g, '').split(' ');
    let kode = '';
    
    words.forEach(word => {
        if (word.length >= 3) {
            kode += word.substring(0, 3);
        } else {
            kode += word;
        }
    });
    
    // Tambahkan timestamp untuk uniqueness
    const timestamp = Date.now().toString().slice(-4);
    return `${kode}${timestamp}`;
};

// GET /api/barang - Lihat semua barang
export const getAllBarang = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = search ? {
            [Op.or]: [
                { nama_barang: { [Op.like]: `%${search}%` } },
                { kode_barang: { [Op.like]: `%${search}%` } }
            ]
        } : {};

        const { count, rows } = await Barang.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['nama_barang', 'ASC']]
        });

        res.status(200).json({
            success: true,
            message: "Data barang berhasil diambil",
            data: {
                barang: rows,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / limit)
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Gagal mengambil data barang",
            error: error.message
        });
    }
};

// GET /api/barang/:id - Lihat detail barang
export const getBarangById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const barang = await Barang.findByPk(id);
        
        if (!barang) {
            return res.status(404).json({
                success: false,
                message: "Barang tidak ditemukan"
            });
        }

        res.status(200).json({
            success: true,
            message: "Detail barang berhasil diambil",
            data: barang
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Gagal mengambil detail barang",
            error: error.message
        });
    }
};

// POST /api/barang - Tambah barang baru
export const createBarang = async (req, res) => {
    try {
        const { 
            nama_barang, 
            satuan = "Unit", 
            batas_minimal = 0, 
            batas_maksimal = 9999, 
            stok = 0,
            // Parameter untuk barang masuk otomatis
            jumlah_masuk = 0
        } = req.body;

        // Validasi input
        if (!nama_barang) {
            return res.status(400).json({
                success: false,
                message: "Nama barang wajib diisi"
            });
        }

        // Generate kode barang otomatis
        let kode_barang = generateKodeBarang(nama_barang);
        
        // Pastikan kode barang unik
        let existingBarang = await Barang.findOne({ where: { kode_barang } });
        let counter = 1;
        
        while (existingBarang) {
            kode_barang = `${generateKodeBarang(nama_barang)}${counter}`;
            existingBarang = await Barang.findOne({ where: { kode_barang } });
            counter++;
        }

        // Buat barang baru
        const newBarang = await Barang.create({
            kode_barang,
            nama_barang,
            satuan,
            stok: parseInt(stok),
            batas_minimal: parseInt(batas_minimal),
            batas_maksimal: parseInt(batas_maksimal)
        });

        let barangMasukData = null;

        // Otomatis buat barang masuk jika ada jumlah_masuk
        if (jumlah_masuk > 0) {
            try {
                // Tanggal otomatis dengan jam lengkap
                const tanggalMasukOtomatis = new Date();
                
                // Buat transaksi barang masuk otomatis
                const barangMasuk = await BarangMasuk.create({
                    barang_id: newBarang.id,
                    jumlah: parseInt(jumlah_masuk),
                    tanggal: tanggalMasukOtomatis
                });

                // Update stok barang
                const stokBaru = newBarang.stok + parseInt(jumlah_masuk);
                await newBarang.update({ stok: stokBaru });

                // Ambil data barang masuk lengkap untuk response
                barangMasukData = await BarangMasuk.findByPk(barangMasuk.id, {
                    include: [{
                        model: Barang,
                        as: 'barang',
                        attributes: ['kode_barang', 'nama_barang', 'satuan', 'stok', 'batas_maksimal']
                    }]
                });
            } catch (barangMasukError) {
                // Jika gagal buat barang masuk, log error tapi tetap return barang yang sudah dibuat
                console.error('Error creating auto barang masuk:', barangMasukError);
            }
        }

        // Refresh data barang untuk mendapatkan stok terbaru
        await newBarang.reload();

        res.status(201).json({
            success: true,
            message: barangMasukData 
                ? "Barang berhasil ditambahkan dengan transaksi masuk otomatis" 
                : "Barang berhasil ditambahkan",
            data: {
                barang: newBarang,
                barang_masuk: barangMasukData
            }
        });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            res.status(400).json({
                success: false,
                message: "Kode barang sudah ada"
            });
        } else {
            res.status(500).json({
                success: false,
                message: "Gagal menambahkan barang",
                error: error.message
            });
        }
    }
};

// PUT /api/barang/:id - Update barang
export const updateBarang = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_barang, satuan, batas_minimal, batas_maksimal, stok } = req.body;

        const barang = await Barang.findByPk(id);
        
        if (!barang) {
            return res.status(404).json({
                success: false,
                message: "Barang tidak ditemukan"
            });
        }

        // Update data
        const updateData = {};
        if (nama_barang) updateData.nama_barang = nama_barang;
        if (satuan) updateData.satuan = satuan;
        if (batas_minimal !== undefined) updateData.batas_minimal = parseInt(batas_minimal);
        if (batas_maksimal !== undefined) updateData.batas_maksimal = parseInt(batas_maksimal);
        if (stok !== undefined && stok >= 0) updateData.stok = parseInt(stok);

        await barang.update(updateData);

        res.status(200).json({
            success: true,
            message: "Barang berhasil diperbarui",
            data: barang
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Gagal memperbarui barang",
            error: error.message
        });
    }
};

// DELETE /api/barang/:id - Hapus barang
export const deleteBarang = async (req, res) => {
    try {
        const { id } = req.params;

        const barang = await Barang.findByPk(id);
        
        if (!barang) {
            return res.status(404).json({
                success: false,
                message: "Barang tidak ditemukan"
            });
        }

        // Cek apakah barang memiliki transaksi
        const hasTransaksiMasuk = await BarangMasuk.findOne({ where: { barang_id: id } });
        const hasTransaksiKeluar = await BarangKeluar.findOne({ where: { barang_id: id } });

        if (hasTransaksiMasuk || hasTransaksiKeluar) {
            return res.status(400).json({
                success: false,
                message: "Tidak dapat menghapus barang yang memiliki riwayat transaksi"
            });
        }

        await barang.destroy();

        res.status(200).json({
            success: true,
            message: "Barang berhasil dihapus"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Gagal menghapus barang",
            error: error.message
        });
    }
};

// GET /api/barang/stok-kurang - Barang dengan stok kurang dari batas minimal
export const getBarangStokKurang = async (req, res) => {
    try {
        const barangStokKurang = await Barang.findAll({
            where: {
                [Op.or]: [
                    { stok: { [Op.lt]: { [Op.col]: 'batas_minimal' } } },
                    { stok: { [Op.eq]: 0 } }
                ]
            },
            order: [['stok', 'ASC']]
        });

        res.status(200).json({
            success: true,
            message: "Data barang dengan stok kurang berhasil diambil",
            data: barangStokKurang,
            count: barangStokKurang.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Gagal mengambil data barang stok kurang",
            error: error.message
        });
    }
};

// GET /api/barang/stok-berlebih - Barang dengan stok melebihi batas maksimal
export const getBarangStokBerlebih = async (req, res) => {
    try {
        const barangStokBerlebih = await Barang.findAll({
            where: {
                stok: { [Op.gt]: { [Op.col]: 'batas_maksimal' } }
            },
            order: [['stok', 'DESC']]
        });

        res.status(200).json({
            success: true,
            message: "Data barang dengan stok berlebih berhasil diambil",
            data: barangStokBerlebih,
            count: barangStokBerlebih.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Gagal mengambil data barang stok berlebih",
            error: error.message
        });
    }
};

// PUT /api/barang/:id/stok - Update stok barang (untuk internal use)
export const updateStokBarang = async (req, res) => {
    try {
        const { id } = req.params;
        const { stok } = req.body;

        if (stok === undefined || stok < 0) {
            return res.status(400).json({
                success: false,
                message: "Stok harus berupa angka positif"
            });
        }

        const barang = await Barang.findByPk(id);
        
        if (!barang) {
            return res.status(404).json({
                success: false,
                message: "Barang tidak ditemukan"
            });
        }

        await barang.update({ stok: parseInt(stok) });

        res.status(200).json({
            success: true,
            message: "Stok barang berhasil diperbarui",
            data: barang
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Gagal memperbarui stok barang",
            error: error.message
        });
    }
};

// GET /api/barang/summary - Ringkasan data barang
export const getBarangSummary = async (req, res) => {
    try {
        const totalBarang = await Barang.count();
        const totalStok = await Barang.sum('stok');
        
        const barangStokKurang = await Barang.count({
            where: {
                [Op.or]: [
                    { stok: { [Op.lt]: { [Op.col]: 'batas_minimal' } } },
                    { stok: { [Op.eq]: 0 } }
                ]
            }
        });

        const barangStokBerlebih = await Barang.count({
            where: {
                stok: { [Op.gt]: { [Op.col]: 'batas_maksimal' } }
            }
        });

        const barangStokHabis = await Barang.count({
            where: { stok: 0 }
        });

        res.status(200).json({
            success: true,
            message: "Ringkasan data barang berhasil diambil",
            data: {
                total_barang: totalBarang || 0,
                total_stok: totalStok || 0,
                barang_stok_kurang: barangStokKurang || 0,
                barang_stok_berlebih: barangStokBerlebih || 0,
                barang_stok_habis: barangStokHabis || 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Gagal mengambil ringkasan data barang",
            error: error.message
        });
    }
};