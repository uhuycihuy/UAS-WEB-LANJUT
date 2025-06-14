import Barang from "../models/Barang.js";
import BarangMasuk from "../models/BarangMasuk.js";
import { Op } from "sequelize";

// GET /api/barang-masuk - Lihat semua transaksi barang masuk
export const getAllBarangMasuk = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', bulan = '', tahun = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = {};
        
        // Filter berdasarkan bulan dan tahun jika disediakan
        if (bulan && tahun) {
            whereClause.tanggal = {
                [Op.and]: [
                    { [Op.gte]: new Date(`${tahun}-${bulan.padStart(2, '0')}-01`) },
                    { [Op.lt]: new Date(`${tahun}-${(parseInt(bulan) + 1).toString().padStart(2, '0')}-01`) }
                ]
            };
        } else if (tahun) {
            whereClause.tanggal = {
                [Op.and]: [
                    { [Op.gte]: new Date(`${tahun}-01-01`) },
                    { [Op.lt]: new Date(`${parseInt(tahun) + 1}-01-01`) }
                ]
            };
        }

        const includeClause = {
            model: Barang,
            as: 'barang',
            attributes: ['kode_barang', 'nama_barang', 'satuan', 'batas_maksimal']
        };

        // Filter berdasarkan search jika disediakan
        if (search) {
            includeClause.where = {
                [Op.or]: [
                    { nama_barang: { [Op.like]: `%${search}%` } },
                    { kode_barang: { [Op.like]: `%${search}%` } }
                ]
            };
        }

        const { count, rows } = await BarangMasuk.findAndCountAll({
            where: whereClause,
            include: [includeClause],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['tanggal', 'DESC'], ['id', 'DESC']]
        });

        res.status(200).json({
            success: true,
            message: "Data barang masuk berhasil diambil",
            data: {
                barang_masuk: rows,
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
            message: "Gagal mengambil data barang masuk",
            error: error.message
        });
    }
};

// GET /api/barang-masuk/:id - Lihat detail transaksi barang masuk
export const getBarangMasukById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const barangMasuk = await BarangMasuk.findByPk(id, {
            include: [{
                model: Barang,
                as: 'barang',
                attributes: ['kode_barang', 'nama_barang', 'satuan', 'stok', 'batas_maksimal']
            }]
        });
        
        if (!barangMasuk) {
            return res.status(404).json({
                success: false,
                message: "Data barang masuk tidak ditemukan"
            });
        }

        res.status(200).json({
            success: true,
            message: "Detail barang masuk berhasil diambil",
            data: barangMasuk
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Gagal mengambil detail barang masuk",
            error: error.message
        });
    }
};

// POST /api/barang-masuk - Catat barang masuk baru
export const createBarangMasuk = async (req, res) => {
    try {
        const { barang_id, jumlah, tanggal } = req.body;

        // Validasi input
        if (!barang_id || !jumlah) {
            return res.status(400).json({
                success: false,
                message: "Barang ID dan jumlah wajib diisi"
            });
        }

        if (jumlah <= 0) {
            return res.status(400).json({
                success: false,
                message: "Jumlah harus lebih dari 0"
            });
        }

        // Cek apakah barang ada
        const barang = await Barang.findByPk(barang_id);
        if (!barang) {
            return res.status(404).json({
                success: false,
                message: "Barang tidak ditemukan"
            });
        }

        // Set tanggal ke hari ini jika tidak disediakan
        const tanggalMasuk = tanggal ? new Date(tanggal) : new Date();

        // Buat transaksi barang masuk
        const barangMasuk = await BarangMasuk.create({
            barang_id: parseInt(barang_id),
            jumlah: parseInt(jumlah),
            tanggal: tanggalMasuk
        });

        // Update stok barang
        const stokBaru = barang.stok + parseInt(jumlah);
        await barang.update({ stok: stokBaru });

        // Ambil data lengkap untuk response
        const barangMasukLengkap = await BarangMasuk.findByPk(barangMasuk.id, {
            include: [{
                model: Barang,
                as: 'barang',
                attributes: ['kode_barang', 'nama_barang', 'satuan', 'stok', 'batas_maksimal']
            }]
        });

        res.status(201).json({
            success: true,
            message: "Barang masuk berhasil dicatat",
            data: barangMasukLengkap
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Gagal mencatat barang masuk",
            error: error.message
        });
    }
};

// PUT /api/barang-masuk/:id - Update transaksi barang masuk
export const updateBarangMasuk = async (req, res) => {
    try {
        const { id } = req.params;
        const { jumlah, tanggal } = req.body;

        // Cari transaksi barang masuk
        const barangMasuk = await BarangMasuk.findByPk(id, {
            include: [{
                model: Barang,
                as: 'barang'
            }]
        });

        if (!barangMasuk) {
            return res.status(404).json({
                success: false,
                message: "Data barang masuk tidak ditemukan"
            });
        }

        // Validasi jumlah jika diubah
        if (jumlah !== undefined && jumlah <= 0) {
            return res.status(400).json({
                success: false,
                message: "Jumlah harus lebih dari 0"
            });
        }

        // Jika jumlah diubah, update stok barang
        if (jumlah !== undefined && jumlah !== barangMasuk.jumlah) {
            const selisih = parseInt(jumlah) - barangMasuk.jumlah;
            const stokBaru = barangMasuk.barang.stok + selisih;
            
            if (stokBaru < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Pengurangan jumlah akan membuat stok negatif"
                });
            }
            
            await barangMasuk.barang.update({ stok: stokBaru });
        }

        // Update data transaksi
        const updateData = {};
        if (jumlah !== undefined) updateData.jumlah = parseInt(jumlah);
        if (tanggal) updateData.tanggal = new Date(tanggal);

        await barangMasuk.update(updateData);

        // Ambil data lengkap untuk response
        const barangMasukUpdated = await BarangMasuk.findByPk(id, {
            include: [{
                model: Barang,
                as: 'barang',
                attributes: ['kode_barang', 'nama_barang', 'satuan', 'stok', 'batas_maksimal']
            }]
        });

        res.status(200).json({
            success: true,
            message: "Data barang masuk berhasil diperbarui",
            data: barangMasukUpdated
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Gagal memperbarui data barang masuk",
            error: error.message
        });
    }
};

// DELETE /api/barang-masuk/:id - Hapus transaksi barang masuk
export const deleteBarangMasuk = async (req, res) => {
    try {
        const { id } = req.params;

        // Cari transaksi barang masuk
        const barangMasuk = await BarangMasuk.findByPk(id, {
            include: [{
                model: Barang,
                as: 'barang'
            }]
        });

        if (!barangMasuk) {
            return res.status(404).json({
                success: false,
                message: "Data barang masuk tidak ditemukan"
            });
        }

        // Cek apakah penghapusan akan membuat stok negatif
        const stokSetelahHapus = barangMasuk.barang.stok - barangMasuk.jumlah;
        if (stokSetelahHapus < 0) {
            return res.status(400).json({
                success: false,
                message: "Tidak dapat menghapus transaksi karena akan membuat stok negatif"
            });
        }

        // Update stok barang
        await barangMasuk.barang.update({ stok: stokSetelahHapus });

        // Hapus transaksi
        await barangMasuk.destroy();

        res.status(200).json({
            success: true,
            message: "Data barang masuk berhasil dihapus"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Gagal menghapus data barang masuk",
            error: error.message
        });
    }
};

// GET /api/barang-masuk/summary/:bulan/:tahun - Ringkasan barang masuk per bulan
export const getBarangMasukSummary = async (req, res) => {
    try {
        const { bulan, tahun } = req.params;

        const whereClause = {
            tanggal: {
                [Op.and]: [
                    { [Op.gte]: new Date(`${tahun}-${bulan.padStart(2, '0')}-01`) },
                    { [Op.lt]: new Date(`${tahun}-${(parseInt(bulan) + 1).toString().padStart(2, '0')}-01`) }
                ]
            }
        };

        const totalTransaksi = await BarangMasuk.count({ where: whereClause });
        const totalJumlah = await BarangMasuk.sum('jumlah', { where: whereClause });

        const topBarang = await BarangMasuk.findAll({
            where: whereClause,
            include: [{
                model: Barang,
                as: 'barang',
                attributes: ['kode_barang', 'nama_barang', 'satuan']
            }],
            attributes: [
                'barang_id',
                [BarangMasuk.sequelize.fn('SUM', BarangMasuk.sequelize.col('jumlah')), 'total_masuk']
            ],
            group: ['barang_id'],
            order: [[BarangMasuk.sequelize.fn('SUM', BarangMasuk.sequelize.col('jumlah')), 'DESC']],
            limit: 5
        });

        res.status(200).json({
            success: true,
            message: "Ringkasan barang masuk berhasil diambil",
            data: {
                periode: `${bulan}/${tahun}`,
                total_transaksi: totalTransaksi || 0,
                total_jumlah: totalJumlah || 0,
                top_barang_masuk: topBarang
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Gagal mengambil ringkasan barang masuk",
            error: error.message
        });
    }
};