import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.API_KEY;

export const checkAuth = (req, res, next) => {
    if (req.headers['x-api-key'] === apiKey) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};