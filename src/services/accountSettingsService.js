import axios from 'axios';

const AUTH_URL = 'http://localhost:3000/api/users';
const PERFILES_URL = 'http://localhost:3001/api/solicitudes';
const PAYMENTS_URL = 'http://localhost:3002/api/settings'; // Mantener para pagos si es necesario

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
      const res = await axios.get(`http://localhost:3003/api/trabajos/${trabajoId}/recibo`);
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

  // --- PAYMENTS (MOCK / OTHER SERVICE) ---
  async getCards() {
    // Si tienes un servicio de pagos, llámalo aquí. Por ahora mockeamos si no existe.
    return [
      { id: 1, type: 'visa', last4: '4242', exp: '12/25', name: 'JUAN PEREZ' }
    ];
  },
  
  async addCard(cardData) { return { success: true }; },
  async removeCard(id) { return { success: true }; },
  async getTwofaStatus() { return { enabled: false }; },
  async toggleTwofa(enabled, method) { return { enabled }; }
};
