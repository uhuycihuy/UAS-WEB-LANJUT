import express from 'express';
import { logRequest } from './middleware/Log.js';
import { checkAuth } from './middleware/Auth.js';
import { checkIpWhitelist } from './middleware/Ip.js';

const app = express();

import { logRequest } from './middleware/Log.js';
import { checkAuth } from './middleware/Auth.js';
import { checkIpWhitelist } from './middleware/Ip.js';
