import Barang from "../models/Barang.js";
import BarangMasuk from "../models/BarangMasuk.js";
import { Op } from "sequelize";

// GET /api/barang-masuk - Lihat semua transaksi barang masuk
export const getAllBarangMasuk = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', bulan = '', tahun = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = {};
        
        // Filter berdasarkan bulan dan tahun 
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
            attributes: ['kode_barang', 'nama_barang', 'satuan', 'batas_maksimal'],
            where: {
                is_deleted: false  
            }
        };

        // Filter berdasarkan search 
        if (search) {
            includeClause.where = {
                ...includeClause.where, 
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
                where: { is_deleted: false },
                attributes: ['kode_barang', 'nama_barang', 'satuan', 'stok', 'batas_maksimal'],
                required: true 
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

// GET /api/barang-masuk/summary/:bulan/:tahun - Ringkasan barang masuk per bulan 
export const getBarangMasukSummary = async (req, res) => {
    try {
        const { bulan, tahun } = req.params;

        // Validasi parameter
        if (!bulan || !tahun) {
            return res.status(400).json({
                success: false,
                message: "Parameter bulan dan tahun wajib diisi"
            });
        }

        // Validasi format bulan (1-12)
        const bulanInt = parseInt(bulan);
        if (isNaN(bulanInt) || bulanInt < 1 || bulanInt > 12) {
            return res.status(400).json({
                success: false,
                message: "Bulan harus berupa angka antara 1-12"
            });
        }

        // Validasi format tahun
        const tahunInt = parseInt(tahun);
        if (isNaN(tahunInt) || tahunInt < 1900 || tahunInt > 2100) {
            return res.status(400).json({
                success: false,
                message: "Tahun tidak valid"
            });
        }

        // Buat whereClause dengan validasi yang lebih aman
        const bulanStr = bulanInt.toString().padStart(2, '0');
        const bulanBerikutnya = bulanInt === 12 ? 1 : bulanInt + 1;
        const tahunBerikutnya = bulanInt === 12 ? tahunInt + 1 : tahunInt;
        const bulanBerikutnyaStr = bulanBerikutnya.toString().padStart(2, '0');

        const whereClause = {
            tanggal: {
                [Op.and]: [
                    { [Op.gte]: new Date(`${tahunInt}-${bulanStr}-01`) },
                    { [Op.lt]: new Date(`${tahunBerikutnya}-${bulanBerikutnyaStr}-01`) }
                ]
            }
        };

        const totalTransaksi = await BarangMasuk.count({
            where: whereClause,
            include: [{
                model: Barang,
                as: 'barang',
                where: { is_deleted: false }, 
                required: true
            }]
        });
        
        const totalJumlah = await BarangMasuk.sum('jumlah', {
            where: whereClause,
            include: [{
                model: Barang,
                as: 'barang',
                where: { is_deleted: false },
                required: true
            }]
        });

        const topBarang = await BarangMasuk.findAll({
            where: whereClause,
            include: [{
                model: Barang,
                as: 'barang',
                where: { is_deleted: false },
                required: true,
                attributes: ['kode_barang', 'nama_barang', 'satuan'],
            }],
            attributes: [
                'barang_id',
                'tanggal',
                [BarangMasuk.sequelize.fn('SUM', BarangMasuk.sequelize.col('jumlah')), 'total_masuk']
            ],
            group: ['barang_id', 'barang.id', 'barang.kode_barang', 'barang.nama_barang', 'barang.satuan', 'tanggal'],
            order: [[BarangMasuk.sequelize.fn('SUM', BarangMasuk.sequelize.col('jumlah')), 'DESC']],
            limit: 5
        });

        res.status(200).json({
            success: true,
            message: "Ringkasan barang masuk berhasil diambil",
            data: {
                periode: `${bulanStr}/${tahunInt}`,
                total_transaksi: totalTransaksi || 0,
                total_jumlah: totalJumlah || 0,
                top_barang_masuk: topBarang
            }
        });
    } catch (error) {
        console.error('Error in getBarangMasukSummary:', error);
        res.status(500).json({
            success: false,
            message: "Gagal mengambil ringkasan barang masuk",
            error: error.message
        });
    }
};