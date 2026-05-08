import { API_URLS, SOCKET_URL } from '../config.js';
import axios from 'axios';

const AUTH_URL = `${API_URLS.AUTH}/api/users`;
const PERFILES_URL = `${API_URLS.PERFILES}/api/solicitudes`;
const PAYMENTS_URL = `${API_URLS.PAGOS}/api/settings`; // Mantener para pagos si es necesario

const getAuthHeaders = () => {
  return {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`
    }
  };
};

export const accountApi = {
  // --- USER DATA ---
  async getMe() {
    try {
      const auth = getAuthHeaders();
      const res = await axios.get(`${AUTH_URL}/me`, { headers: auth.headers });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Error al obtener datos");
    }
  },

  // --- EMAIL ---
  async changeEmail(newEmail) {
    try {
      const auth = getAuthHeaders();
      const res = await axios.post(`${AUTH_URL}/change-email`, { newEmail }, { headers: auth.headers });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Error al actualizar email");
    }
  },

  // --- RECEIPTS ---
  async getReceipt(trabajoId) {
    try {
      const res = await axios.get(`${API_URLS.TRABAJOS}/api/trabajos/${trabajoId}/recibo`);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Error al obtener el recibo");
    }
  },

  // --- PASSWORD ---
  async updatePassword({ current, next }) {
    try {
      const auth = getAuthHeaders();
      const res = await axios.post(`${AUTH_URL}/change-password`, { 
        oldPassword: current, 
        newPassword: next 
      }, { headers: auth.headers });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Error al actualizar contraseña");
    }
  },

  // --- SESSIONS ---
  async getSessions() {
    try {
      const auth = getAuthHeaders();
      const res = await axios.get(`${AUTH_URL}/sessions`, {
        headers: auth.headers
      });
      return res.data; // Retorna el array directamente según mi server.js
    } catch (err) {
      throw new Error(err.response?.data?.message || "Error obteniendo sesiones");
    }
  },

  async closeSession(id) {
    try {
      const auth = getAuthHeaders();
      const res = await axios.delete(`${AUTH_URL}/sessions/${id}`, { headers: auth.headers });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Error cerrando sesión");
    }
  },

  // --- DANGER ---
  async deactivateAccount() {
    try {
      const auth = getAuthHeaders();
      const userId = localStorage.getItem('usuario_id');
      const res = await axios.put(`${AUTH_URL}/deactivate`, { userId }, { headers: auth.headers });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Error desactivando cuenta");
    }
  },

  async deleteAccount() {
    try {
      const auth = getAuthHeaders();
      const userId = localStorage.getItem('usuario_id');
      const res = await axios.delete(`${AUTH_URL}/${userId}`, {
        headers: auth.headers
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Error eliminando cuenta");
    }
  },

  // --- PAYMENTS ---
  async getCards() {
    try {
      const auth = getAuthHeaders();
      const userId = localStorage.getItem('usuario_id');
      const res = await axios.get(`${PAYMENTS_URL}/payments/${userId}`, { headers: auth.headers });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Error al obtener tarjetas");
    }
  },
  
  async addCard(cardData) {
    try {
      const auth = getAuthHeaders();
      const userId = localStorage.getItem('usuario_id');
      const res = await axios.post(`${PAYMENTS_URL}/payments`, {
        ...cardData,
        usuario_id: userId
      }, { headers: auth.headers });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Error al agregar tarjeta");
    }
  },

  async removeCard(id) {
    try {
      const auth = getAuthHeaders();
      const res = await axios.delete(`${PAYMENTS_URL}/payments/${id}`, { headers: auth.headers });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Error al eliminar tarjeta");
    }
  },

  async getTwofaStatus() {
    try {
      const auth = getAuthHeaders();
      const res = await axios.get(`${PAYMENTS_URL}/twofa`, { headers: auth.headers });
      return res.data;
    } catch (err) {
      return { enabled: false };
    }
  },

  async toggleTwofa(enabled, method) {
    try {
      const auth = getAuthHeaders();
      const res = await axios.post(`${PAYMENTS_URL}/twofa`, { enabled, method }, { headers: auth.headers });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Error al actualizar 2FA");
    }
  }
};
