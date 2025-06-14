import express from 'express';
import cors from "cors";
import dotenv from "dotenv";
import { logRequest } from './middleware/Log.js';
import { checkAuth } from './middleware/Auth.js';
import { checkIpWhitelist } from './middleware/Ip.js';

const app = express();
dotenv.config();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(logRequest);
app.use(checkAuth);
app.use(checkIpWhitelist);

app.listen(PORT, () => {
  console.log(`Server berjalan dengan port ${PORT}`); 
});