import axios from 'axios';

const instance = axios.create({
  timeout: 5 * 1000,
  withCredentials: false,
});

export default instance;
