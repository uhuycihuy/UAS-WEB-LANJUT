import {Sequelize} from "sequelize";

const db = new Sequelize('inventory_laptop', 'root', '', {
  host: 'localhost',
  dialect: 'mysql', 
  port: 3306,
  timezone: '+07:00',
  logging: false,
  pool: {
    max: 10,
    idle: 30000
  },
  dialectOptions: {
    connectTimeout: 60000
  }
});

(async () => {
  try {
    await db.authenticate();
    console.log("Database MySQL terkoneksi :)!!");
  } catch (err) {
    console.error("Koneksi database error:", err);
  }
})();

export default db;