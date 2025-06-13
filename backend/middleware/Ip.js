import dotenv from "dotenv";
dotenv.config();

const allowedIps = process.env.IP_YG_BOLEH
  ? process.env.IP_YG_BOLEH.split(',').map(ip => ip.trim())
  : [];

export const checkIpWhitelist = (req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress;

  if (!allowedIps.includes(clientIp)) {
    return res.status(403).json({ message: '⚠️ IP tidak diizinkan' });
  }

  next();
};