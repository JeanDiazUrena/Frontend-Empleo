import { reactive, computed } from 'vue';

// 1. ESTADO GLOBAL (Se mantiene sincronizado en toda la app)
const state = reactive({
  user: {
    id: localStorage.getItem('usuario_id') || '',
    name: localStorage.getItem('usuario_nombre') || '',
    email: localStorage.getItem('usuario_email') || '',
    role: localStorage.getItem('user_role') || '',
    phone: localStorage.getItem('usuario_telefono') || '',
    location: localStorage.getItem('usuario_direccion') || '',
    avatar: localStorage.getItem('usuario_avatar') || ''
  },
  token: localStorage.getItem('token') || ''
});

export function useUserSession() {
  
  // Computed: ¿Hay sesión activa?
  const isLoggedIn = computed(() => !!state.user.id);

  // Computed: Iniciales
  const userInitials = computed(() => {
    if (!state.user.name) return 'CL';
    const parts = state.user.name.split(' ');
    return parts.length > 1 
      ? (parts[0][0] + parts[1][0]).toUpperCase() 
      : parts[0].substring(0, 2).toUpperCase();
  });

  // ACCIÓN: Iniciar Sesión (Login o Registro)
  const login = (userData, token) => {
    // 1. Actualizar estado en memoria (Reactividad inmediata)
    state.user.id = userData.id;
    state.user.name = userData.nombre || userData.name;
    state.user.email = userData.email;
    state.user.role = userData.rol || userData.role;
    state.user.phone = userData.telefono || '';
    state.user.location = userData.direccion || '';
    state.user.avatar = userData.avatar || '';
    state.token = token || 'dummy-token'; // Si el registro no da token, ponemos uno temporal

    // 2. Guardar en disco (Para cuando recargues la página)
    localStorage.setItem('usuario_id', state.user.id);
    localStorage.setItem('usuario_nombre', state.user.name);
    localStorage.setItem('usuario_email', state.user.email);
    localStorage.setItem('user_role', state.user.role);
    if (state.token) localStorage.setItem('token', state.token);
    if (state.user.phone) localStorage.setItem('usuario_telefono', state.user.phone);
    if (state.user.location) localStorage.setItem('usuario_direccion', state.user.location);
  };

  // ACCIÓN: Actualizar Perfil
  const updateProfile = (newData) => {
    if (newData.name) { state.user.name = newData.name; localStorage.setItem('usuario_nombre', newData.name); }
    if (newData.phone) { state.user.phone = newData.phone; localStorage.setItem('usuario_telefono', newData.phone); }
    if (newData.location) { state.user.location = newData.location; localStorage.setItem('usuario_direccion', newData.location); }
    if (newData.avatar) { state.user.avatar = newData.avatar; localStorage.setItem('usuario_avatar', newData.avatar); }
  };

  // ACCIÓN: Cerrar Sesión
  const logout = () => {
    Object.keys(state.user).forEach(key => state.user[key] = '');
    state.token = '';
    localStorage.clear();
  };

  return { state, isLoggedIn, userInitials, login, updateProfile, logout };
}