import axios from 'axios';

axios.defaults.timeout = 5 * 1000;
axios.defaults.withCredentials = false;

export default axios;
