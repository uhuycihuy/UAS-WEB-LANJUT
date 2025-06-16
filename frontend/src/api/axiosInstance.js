import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'x-api-key': process.env.REACT_APP_API_KEY || 'uhuycihuy' // fallback untuk jaga-jaga
  }
});

export default axiosInstance;
