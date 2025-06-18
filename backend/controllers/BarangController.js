import Barang from "../models/Barang.js";
import BarangMasuk from "../models/BarangMasuk.js";
import { Op } from "sequelize";

// Generate kode barang dari nama
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

        const whereClause = {
            is_deleted: false, // hanya ambil barang yang belum dihapus
            ...(search && {
                [Op.or]: [
                    { nama_barang: { [Op.like]: `%${search}%` } },
                    { kode_barang: { [Op.like]: `%${search}%` } }
                ]
            })
        };

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
      
        const barang = await Barang.findOne({
            where: {
                id: id,
                is_deleted: false
            }
        });
        
        if (!barang) {
            return res.status(404).json({
                success: false,
                message: "Barang tidak ditemukan atau sudah di hapus"
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

        const stokMin = parseInt(batas_minimal);
        const stokMax = parseInt(batas_maksimal);

        if (stokMin >= stokMax) {
            return res.status(400).json({
                success: false,
                message: "Stok minimum harus lebih kecil dari stok maksimum"
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

        const barang = await Barang.findOne({
            where: {
                id: id,
                is_deleted: false
            }
        });
        
        if (!barang) {
            return res.status(404).json({
                success: false,
                message: "Barang tidak ditemukan"
            });
        }

        const stokMin = parseInt(batas_minimal);
        const stokMax = parseInt(batas_maksimal);

        if (stokMin >= stokMax) {
            return res.status(400).json({
                success: false,
                message: "Stok minimum harus lebih kecil dari stok maksimum"
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

        // Soft delete: tandai barang sebagai sudah dihapus
        barang.is_deleted = true;
        await barang.save();

        res.status(200).json({
            success: true,
            message: "Barang berhasil dihapus (soft delete)"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Gagal menghapus barang",
            error: error.message
        });
    }
};

// GET /api/barang/stok-kurang - Barang dengan stok kurang dari batas minimal (with pagination)
export const getBarangStokKurang = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        // Debug: Log untuk melihat proses
        console.log('=== DEBUG STOK KURANG ===');
        
        // Ambil semua barang terlebih dahulu, lalu filter di JavaScript
        let whereClause = {
            is_deleted: false
        };
        
        // Tambahkan search jika ada
        if (search) {
            whereClause = {
                is_deleted: false,
                [Op.or]: [
                    { nama_barang: { [Op.like]: `%${search}%` } },
                    { kode_barang: { [Op.like]: `%${search}%` } }
                ]
            };
        }

        // Ambil semua data yang sesuai dengan search
        const allBarang = await Barang.findAll({
            where: whereClause,
            order: [['stok', 'ASC'], ['nama_barang', 'ASC']]
        });

        console.log('Total barang ditemukan:', allBarang.length);
        
        // Debug: Log beberapa data sample
        if (allBarang.length > 0) {
            console.log('Sample barang:', {
                nama: allBarang[0].nama_barang,
                stok: allBarang[0].stok,
                batas_minimal: allBarang[0].batas_minimal,
                stok_type: typeof allBarang[0].stok,
                batas_type: typeof allBarang[0].batas_minimal
            });
        }

        // Filter barang dengan stok kurang di JavaScript dengan parsing yang aman
        const barangStokKurang = allBarang.filter(barang => {
            const stok = parseInt(barang.stok) || 0;
            const batasMinimal = parseInt(barang.batas_minimal) || 0;
            const isStokKurang = stok < batasMinimal || stok === 0;
            
            // Debug log per item
            if (allBarang.length <= 5) { // Hanya log jika data sedikit
                console.log(`${barang.nama_barang}: stok=${stok}, min=${batasMinimal}, kurang=${isStokKurang}`);
            }
            
            return isStokKurang;
        });

        console.log('Barang dengan stok kurang:', barangStokKurang.length);

        // Manual pagination
        const total = barangStokKurang.length;
        const startIndex = offset;
        const endIndex = startIndex + parseInt(limit);
        const paginatedBarang = barangStokKurang.slice(startIndex, endIndex);

        res.status(200).json({
            success: true,
            message: "Data barang dengan stok kurang berhasil diambil",
            data: {
                barang: paginatedBarang,
                pagination: {
                    total: total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / limit)
                },
                debug: {
                    total_barang_tersedia: allBarang.length,
                    barang_stok_kurang: barangStokKurang.length
                }
            }
        });
    } catch (error) {
        console.error('Error di getBarangStokKurang:', error);
        res.status(500).json({
            success: false,
            message: "Gagal mengambil data barang stok kurang",
            error: error.message
        });
    }
};

// GET /api/barang/stok-berlebih - Barang dengan stok melebihi batas maksimal (with pagination)
export const getBarangStokBerlebih = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        // Debug: Log untuk melihat proses
        console.log('=== DEBUG STOK BERLEBIH ===');

        // Ambil semua barang terlebih dahulu, lalu filter di JavaScript
        let whereClause = {
            is_deleted: false
        };
        
        // Tambahkan search jika ada
        if (search) {
            whereClause = {
                is_deleted: false,
                [Op.or]: [
                    { nama_barang: { [Op.like]: `%${search}%` } },
                    { kode_barang: { [Op.like]: `%${search}%` } }
                ]
            };
        }

        // Ambil semua data yang sesuai dengan search
        const allBarang = await Barang.findAll({
            where: whereClause,
            order: [['stok', 'DESC'], ['nama_barang', 'ASC']]
        });

        console.log('Total barang ditemukan:', allBarang.length);

        // Filter barang dengan stok berlebih di JavaScript dengan parsing yang aman
        const barangStokBerlebih = allBarang.filter(barang => {
            const stok = parseInt(barang.stok) || 0;
            const batasMaksimal = parseInt(barang.batas_maksimal) || 0;
            const isStokBerlebih = stok > batasMaksimal;
            
            // Debug log per item
            if (allBarang.length <= 5) { // Hanya log jika data sedikit
                console.log(`${barang.nama_barang}: stok=${stok}, max=${batasMaksimal}, berlebih=${isStokBerlebih}`);
            }
            
            return isStokBerlebih;
        });

        console.log('Barang dengan stok berlebih:', barangStokBerlebih.length);

        // Manual pagination
        const total = barangStokBerlebih.length;
        const startIndex = offset;
        const endIndex = startIndex + parseInt(limit);
        const paginatedBarang = barangStokBerlebih.slice(startIndex, endIndex);

        res.status(200).json({
            success: true,
            message: "Data barang dengan stok berlebih berhasil diambil",
            data: {
                barang: paginatedBarang,
                pagination: {
                    total: total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / limit)
                },
                debug: {
                    total_barang_tersedia: allBarang.length,
                    barang_stok_berlebih: barangStokBerlebih.length
                }
            }
        });
    } catch (error) {
        console.error('Error di getBarangStokBerlebih:', error);
        res.status(500).json({
            success: false,
            message: "Gagal mengambil data barang stok berlebih",
            error: error.message
        });
    }
};


// GET /api/barang/summary - Ringkasan data barang (FIXED VERSION)
export const getBarangSummary = async (req, res) => {
    try {
        console.log('=== DEBUG SUMMARY ===');
        
        const totalBarang = await Barang.count({
            where: {is_deleted: false}
        });
        const totalStok = await Barang.sum('stok', {
            where: {is_deleted: false}
        });
        
        console.log('Total barang:', totalBarang);
        console.log('Total stok:', totalStok);
        
        // Ambil semua data dan filter di JavaScript untuk akurasi
        const allBarang = await Barang.findAll({
            where: {is_deleted: false},
            attributes: ['id', 'stok', 'batas_minimal', 'batas_maksimal']
        });
        
        const barangStokKurang = allBarang.filter(barang => {
            const stok = parseInt(barang.stok) || 0;
            const batasMinimal = parseInt(barang.batas_minimal) || 0;
            return stok < batasMinimal || stok === 0;
        }).length;

        const barangStokBerlebih = allBarang.filter(barang => {
            const stok = parseInt(barang.stok) || 0;
            const batasMaksimal = parseInt(barang.batas_maksimal) || 0;
            return stok > batasMaksimal;
        }).length;

        const barangStokHabis = allBarang.filter(barang => {
            const stok = parseInt(barang.stok) || 0;
            return stok === 0;
        }).length;

        console.log('Stok kurang:', barangStokKurang);
        console.log('Stok berlebih:', barangStokBerlebih);
        console.log('Stok habis:', barangStokHabis);

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
        console.error('Error di getBarangSummary:', error);
        res.status(500).json({
            success: false,
            message: "Gagal mengambil ringkasan data barang",
            error: error.message
        });
    }
};

export const getDeletedBarang = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = {
            is_deleted: true
        };

        if (search) {
            whereClause[Op.or] = [
                { nama_barang: { [Op.like]: `%${search}%` } },
                { kode_barang: { [Op.like]: `%${search}%` } }
            ];
        }

        const allDeleted = await Barang.findAll({
            where: whereClause,
            order: [['nama_barang', 'ASC']]
        });

        const total = allDeleted.length;
        const paginatedBarang = allDeleted.slice(offset, offset + parseInt(limit));

        res.status(200).json({
            success: true,
            message: "Data barang yang dihapus berhasil diambil",
            data: {
                barang: paginatedBarang,
                pagination: {
                    total: total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Gagal mengambil data barang yang dihapus",
            error: error.message
        });
    }
};
