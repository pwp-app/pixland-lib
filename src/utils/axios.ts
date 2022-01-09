import axios from 'axios';

axios.defaults.timeout = 10 * 1000;
axios.defaults.withCredentials = false;

export default axios;
