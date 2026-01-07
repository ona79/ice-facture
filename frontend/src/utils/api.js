import axios from 'axios';

// Cette ligne choisit l'URL de Render si elle existe, sinon utilise localhost
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000" : "https://ta-facture.onrender.com");

const api = axios.create({
  baseURL: `${API_URL}/api`
});

export default api;