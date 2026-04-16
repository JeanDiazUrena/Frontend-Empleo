import axios from 'axios';

const API_URL = 'http://localhost:3002/api/settings';

// Se asume que en el caso real enviamos el userId o un token en las cabeceras
const getAuthHeaders = () => {
  const userId = localStorage.getItem('usuario_id') || 1;
  return {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`
    },
    userId // Para simulación rápida, en producción usar token
  };
};

export const accountApi = {
  // --- PASSWORD ---
  async updatePassword({ current, next }) {
    try {
      const auth = getAuthHeaders();
      const res = await axios.post(`${API_URL}/password`, { 
        userId: auth.userId, 
        current, 
        next 
      }, { headers: auth.headers });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Error al actualizar contraseña");
    }
  },

  // --- EMAIL ---
  async requestEmailChangeCode(newEmail) {
    try {
      const res = await axios.post(`${API_URL}/email/code`, { newEmail });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Error al enviar código");
    }
  },

  async verifyEmailCode(code, newEmail) {
    try {
      const auth = getAuthHeaders();
      const res = await axios.post(`${API_URL}/email/verify`, {
        userId: auth.userId,
        code,
        newEmail
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Error verificando código");
    }
  },

  // --- PAYMENTS ---
  async getCards() {
    try {
      const auth = getAuthHeaders();
      const res = await axios.get(`${API_URL}/payments`, {
        params: { userId: auth.userId },
        headers: auth.headers
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Error obteniendo tarjetas");
    }
  },

  async addCard(cardData) {
    try {
      const auth = getAuthHeaders();
      const payload = { ...cardData, userId: auth.userId };
      const res = await axios.post(`${API_URL}/payments`, payload, { headers: auth.headers });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Error agregando tarjeta");
    }
  },

  async removeCard(id) {
    try {
      const res = await axios.delete(`${API_URL}/payments/${id}`);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Error eliminando tarjeta");
    }
  },

  // --- 2FA ---
  async getTwofaStatus() {
    try {
      const auth = getAuthHeaders();
      const res = await axios.get(`${API_URL}/twofa`, {
        params: { userId: auth.userId },
        headers: auth.headers
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Error obteniendo estado 2FA");
    }
  },

  async toggleTwofa(enabled, method) {
    try {
      const auth = getAuthHeaders();
      const res = await axios.post(`${API_URL}/twofa`, {
        userId: auth.userId,
        enabled,
        method
      }, { headers: auth.headers });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Error actualizando 2FA");
    }
  },

  // --- SESSIONS ---
  async getSessions() {
    try {
      const auth = getAuthHeaders();
      const res = await axios.get(`${API_URL}/sessions`, {
        params: { userId: auth.userId },
        headers: auth.headers
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Error obteniendo sesiones");
    }
  },

  async closeSession(id) {
    try {
      const res = await axios.delete(`${API_URL}/sessions/${id}`);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Error cerrando sesión");
    }
  },

  async closeOtherSessions() {
    try {
      const auth = getAuthHeaders();
      const res = await axios.delete(`${API_URL}/sessions`, {
        data: { userId: auth.userId },
        headers: auth.headers
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Error cerrando sesiones");
    }
  },

  // --- DANGER ---
  async deactivateAccount() {
    try {
      const auth = getAuthHeaders();
      const res = await axios.post(`${API_URL}/deactivate`, { userId: auth.userId }, { headers: auth.headers });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Error desactivando cuenta");
    }
  },

  async deleteAccount() {
    try {
      const auth = getAuthHeaders();
      const res = await axios.delete(`${API_URL}/account`, {
        data: { userId: auth.userId },
        headers: auth.headers
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Error eliminando cuenta");
    }
  }
};
