import { reactive, computed } from 'vue';

// Helper para obtener cuentas guardadas
const getSavedAccounts = () => {
  try {
    return JSON.parse(localStorage.getItem('saved_accounts') || '[]');
  } catch {
    return [];
  }
};

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
  token: localStorage.getItem('token') || '',
  accounts: getSavedAccounts() // Lista de todas las cuentas logueadas
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

  // Guardar lista de cuentas en localStorage
  const persistAccounts = () => {
    localStorage.setItem('saved_accounts', JSON.stringify(state.accounts));
  };

  // ACCIÓN: Iniciar Sesión (Login o Registro)
  const login = (userData, token) => {
    const newUser = {
      id: userData.id,
      name: userData.nombre || userData.name,
      email: userData.email,
      role: userData.rol || userData.role,
      phone: userData.telefono || '',
      location: userData.direccion || '',
      avatar: userData.avatar || '',
      token: token || 'dummy-token'
    };

    // 1. Actualizar estado actual
    state.user.id = newUser.id;
    state.user.name = newUser.name;
    state.user.email = newUser.email;
    state.user.role = newUser.role;
    state.user.phone = newUser.phone;
    state.user.location = newUser.location;
    state.user.avatar = newUser.avatar;
    state.token = newUser.token;

    // 2. Guardar en localStorage actual
    localStorage.setItem('usuario_id', state.user.id);
    localStorage.setItem('usuario_nombre', state.user.name);
    localStorage.setItem('usuario_email', state.user.email);
    localStorage.setItem('user_role', state.user.role);
    localStorage.setItem('token', state.token);
    if (state.user.phone) localStorage.setItem('usuario_telefono', state.user.phone);
    if (state.user.location) localStorage.setItem('usuario_direccion', state.user.location);

    // 3. Agregar a la lista de cuentas si no existe
    const index = state.accounts.findIndex(acc => acc.id === newUser.id);
    if (index === -1) {
      state.accounts.push(newUser);
    } else {
      state.accounts[index] = newUser; // Actualizar datos
    }
    persistAccounts();
  };

  // ACCIÓN: Cambiar de cuenta
  const switchAccount = (userId) => {
    const target = state.accounts.find(acc => acc.id === userId);
    if (target) {
      login(target, target.token);
      return true;
    }
    return false;
  };

  // ACCIÓN: Actualizar Perfil
  const updateProfile = (newData) => {
    if (newData.name) { state.user.name = newData.name; localStorage.setItem('usuario_nombre', newData.name); }
    if (newData.phone) { state.user.phone = newData.phone; localStorage.setItem('usuario_telefono', newData.phone); }
    if (newData.location) { state.user.location = newData.location; localStorage.setItem('usuario_direccion', newData.location); }
    if (newData.avatar) { state.user.avatar = newData.avatar; localStorage.setItem('usuario_avatar', newData.avatar); }
    
    // Actualizar también en la lista de cuentas
    const index = state.accounts.findIndex(acc => acc.id === state.user.id);
    if (index !== -1) {
      state.accounts[index] = { ...state.accounts[index], ...state.user };
      persistAccounts();
    }
  };

  // ACCIÓN: Cerrar Sesión (Una sola cuenta)
  const logoutAccount = (userId) => {
    state.accounts = state.accounts.filter(acc => acc.id !== userId);
    persistAccounts();
    
    if (state.user.id === userId) {
      if (state.accounts.length > 0) {
        switchAccount(state.accounts[0].id);
      } else {
        logoutAll();
      }
    }
  };

  // ACCIÓN: Cerrar Todo
  const logoutAll = () => {
    Object.keys(state.user).forEach(key => state.user[key] = '');
    state.token = '';
    state.accounts = [];
    localStorage.clear();
  };

  return { 
    state, 
    isLoggedIn, 
    userInitials, 
    login, 
    switchAccount, 
    updateProfile, 
    logout: logoutAccount, 
    logoutAll 
  };
}