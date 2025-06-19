import Barang from "../models/Barang.js";
import BarangKeluar from "../models/BarangKeluar.js";
import { Op } from "sequelize";

// GET /api/barang-keluar - Lihat semua transaksi barang keluar
export const getAllBarangKeluar = async (req, res) => {
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
            where: {
                is_deleted: false,
                ...(search && {
                    [Op.or]: [
                        { nama_barang: { [Op.like]: `%${search}%` } },
                        { kode_barang: { [Op.like]: `%${search}%` } }
                    ]
                })
            },
            required: true,
            attributes: ['kode_barang', 'nama_barang', 'satuan', 'batas_maksimal']
        };

        // Filter berdasarkan search 
        if (search) {
            includeClause.where = {
                [Op.or]: [
                    { nama_barang: { [Op.like]: `%${search}%` } },
                    { kode_barang: { [Op.like]: `%${search}%` } }
                ]
            };
        }

        const { count, rows } = await BarangKeluar.findAndCountAll({
            where: whereClause,
            include: [includeClause],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['tanggal', 'DESC'], ['id', 'DESC']]
        });

        res.status(200).json({
            success: true,
            message: "Data barang keluar berhasil diambil",
            data: {
                barang_keluar: rows,
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
            message: "Gagal mengambil data barang keluar",
            error: error.message
        });
    }
};

// GET /api/barang-keluar/:id - Lihat detail transaksi barang keluar
export const getBarangKeluarById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const barangKeluar = await BarangKeluar.findByPk(id, {
            include: [{
                model: Barang,
                as: 'barang',
                where: {
                    is_deleted: false,
                    ...(search && {
                        [Op.or]: [
                            { nama_barang: { [Op.like]: `%${search}%` } },
                            { kode_barang: { [Op.like]: `%${search}%` } }
                        ]
                    })
                },
                required: true,
                attributes: ['kode_barang', 'nama_barang', 'satuan', 'stok', 'batas_maksimal']
            }]
        });
        
        if (!barangKeluar) {
            return res.status(404).json({
                success: false,
                message: "Data barang keluar tidak ditemukan atau barang sudah dihapus"
            });
        }

        res.status(200).json({
            success: true,
            message: "Detail barang keluar berhasil diambil",
            data: barangKeluar
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Gagal mengambil detail barang keluar",
            error: error.message
        });
    }
};
// POST /api/barang-keluar - Catat barang keluar baru
export const createBarangKeluar = async (req, res) => {
    try {
        const { barang_id, jumlah } = req.body; 
     
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
        
        const barang = await Barang.findOne({
            where: {
                id: barang_id,
                is_deleted: false
            }
        });
        if (!barang) {
            return res.status(404).json({
                success: false,
                message: "Barang tidak ditemukan atau sudah dihapus"
            });
        }
        
        if (barang.stok < parseInt(jumlah)) {
            return res.status(400).json({
                success: false,
                message: `Stok tidak mencukupi. Stok tersedia: ${barang.stok}`
            });
        }
        
        const tanggalKeluar = new Date();
        
        const tanggalKeluarWIB = new Date(tanggalKeluar.getTime() + (7 * 60 * 60 * 1000));
        
        const barangKeluar = await BarangKeluar.create({
            barang_id: parseInt(barang_id),
            jumlah: parseInt(jumlah),
            tanggal: tanggalKeluarWIB
        });
        
        const stokBaru = barang.stok - parseInt(jumlah);
        await barang.update({ stok: stokBaru });
        
        const barangKeluarLengkap = await BarangKeluar.findByPk(barangKeluar.id, {
            include: [{
                model: Barang,
                as: 'barang',
                attributes: ['kode_barang', 'nama_barang', 'satuan', 'stok', 'batas_maksimal']
            }]
        });
        
        res.status(201).json({
            success: true,
            message: "Barang keluar berhasil dicatat",
            data: {
                ...barangKeluarLengkap.toJSON(),
                tanggal_formatted: tanggalKeluarWIB.toISOString().split('T')[0], // Format: YYYY-MM-DD
                waktu_dicatat: tanggalKeluarWIB.toLocaleString('id-ID', {
                    timeZone: 'Asia/Jakarta',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                })
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Gagal mencatat barang keluar",
            error: error.message
        });
    }
};

// GET /api/barang-keluar/summary/:bulan/:tahun - Ringkasan barang keluar per bulan
export const getBarangKeluarSummary = async (req, res) => {
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

        const totalTransaksi = await BarangKeluar.count({ 
            where: whereClause,
            include: [{
                model: Barang,
                as: 'barang',
                where: { is_deleted: false }, 
                required: true
            }]
         });
        const totalJumlah = await BarangKeluar.sum('jumlah', { 
            where: whereClause,
            include: [{
                model: Barang,
                as: 'barang',
                where: { is_deleted: false }, 
                required: true
            }] 
        });

        const topBarang = await BarangKeluar.findAll({
            where: whereClause,
            include: [{
                model: Barang,
                as: 'barang',
                where: { is_deleted: false },
                required: true,
                attributes: ['kode_barang', 'nama_barang', 'satuan']
            }],
            attributes: [
                'barang_id',
                [BarangKeluar.sequelize.fn('SUM', BarangKeluar.sequelize.col('jumlah')), 'total_keluar']
            ],
            group: ['barang_id'],
            order: [[BarangKeluar.sequelize.fn('SUM', BarangKeluar.sequelize.col('jumlah')), 'DESC']],
            limit: 5
        });

        res.status(200).json({
            success: true,
            message: "Ringkasan barang keluar berhasil diambil",
            data: {
                periode: `${bulan}/${tahun}`,
                total_transaksi: totalTransaksi || 0,
                total_jumlah: totalJumlah || 0,
                top_barang_keluar: topBarang
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Gagal mengambil ringkasan barang keluar",
            error: error.message
        });
    }
};

