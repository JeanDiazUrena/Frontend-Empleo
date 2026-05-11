<script setup>
import { ref } from 'vue';

// ─── COMPOSABLES ──────────────────────────────────────────────
import { usePassword } from '../composables/settings/usePassword';
import { useEmail } from '../composables/settings/useEmail';
import { usePayments } from '../composables/settings/usePayments';
import { useTwoFA } from '../composables/settings/useTwoFA';
import { useSessions } from '../composables/settings/useSessions';
import { useDangerZone } from '../composables/settings/useDangerZone';
import CreditCardFields from '../components/payments/CreditCardFields.vue';
import PaymentCardVisual from '../components/payments/PaymentCardVisual.vue';

// ─── TABS ─────────────────────────────────────────────────────
const activeTab = ref('password');

const tabs = [
  { id: 'password',  label: 'Contraseña',       icon: 'lock' },
  { id: 'email',     label: 'Correo',            icon: 'mail' },
  { id: 'payments',  label: 'Métodos de pago',   icon: 'card' },
  { id: 'twofa',     label: '2FA',               icon: 'shield' },
  { id: 'sessions',  label: 'Sesiones',          icon: 'devices' },
  { id: 'danger',    label: 'Zona peligrosa',    icon: 'danger' },
];

// ─── ESTADO E INSTANCIAS DE COMPOSABLES ───────────────────────
const {
  pwd,
  showPwd,
  pwdMsg,
  pwdSuccess,
  isUpdating: isPwdUpdating,
  strength,
  strengthLabel,
  strengthColor,
  passwordChecks,
  passwordHint,
  passwordRequirements,
  updatePassword
} = usePassword();
const { currentEmail, newEmail, emailMsg, emailSuccess, isUpdating: isEmailUpdating, sendCode } = useEmail();
const { cards, showAddCard, newCard, cardMsg, isUpdating: isCardUpdating, removeCard, addCard } = usePayments();
const { twofa, isUpdating: isTwoFAUpdating, toggleTwoFA } = useTwoFA();
const { sessions, isUpdating: isSessionsUpdating, closeSession, closeOtherSessions } = useSessions();
const { confirmDelete, showDeleteModal, showDeactivateModal, isDeleting, isDeactivating, deactivateAccount, deleteAccount } = useDangerZone();
</script>

<template>
  <div class="cfg-container">

    <!-- HEADER -->
    <div class="cfg-header">
      <div>
        <h1 class="cfg-title">Configuración</h1>
        <p class="cfg-subtitle">Gestiona tu seguridad, privacidad y datos de cuenta</p>
      </div>
    </div>

    <!-- TAB NAV -->
    <nav class="cfg-tabs">
      <button
        v-for="t in tabs"
        :key="t.id"
        :class="['cfg-tab', { active: activeTab === t.id, danger: t.id === 'danger' }]"
        @click="activeTab = t.id"
      >
        <!-- Lock -->
        <svg v-if="t.icon === 'lock'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clip-rule="evenodd"/></svg>
        <!-- Mail -->
        <svg v-else-if="t.icon === 'mail'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z"/><path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z"/></svg>
        <!-- Card -->
        <svg v-else-if="t.icon === 'card'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M2.5 4A1.5 1.5 0 0 0 1 5.5v1h18v-1A1.5 1.5 0 0 0 17.5 4h-15ZM19 8.5H1V14a1.5 1.5 0 0 0 1.5 1.5h15A1.5 1.5 0 0 0 19 14V8.5ZM3 13.25a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75Zm4.75-.75a.75.75 0 0 0 0 1.5h3.5a.75.75 0 0 0 0-1.5h-3.5Z"/></svg>
        <!-- Shield -->
        <svg v-else-if="t.icon === 'shield'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9.661 2.237a.531.531 0 0 1 .678 0 11.947 11.947 0 0 0 7.078 2.749.5.5 0 0 1 .479.425c.069.52.104 1.05.104 1.589 0 5.162-3.26 9.563-7.834 11.256a.48.48 0 0 1-.332 0C5.26 16.563 2 12.162 2 7c0-.538.035-1.069.104-1.589a.5.5 0 0 1 .48-.425 11.947 11.947 0 0 0 7.077-2.749Z" clip-rule="evenodd"/></svg>
        <!-- Devices -->
        <svg v-else-if="t.icon === 'devices'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M14 6H6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Z"/><path fill-rule="evenodd" d="M6 4a2 2 0 0 0-2 2v.5H3a1 1 0 0 0 0 2h1v3H3a1 1 0 1 0 0 2h1V14a2 2 0 0 0 2 2v.5a1 1 0 1 0 2 0V16h2v.5a1 1 0 1 0 2 0V16a2 2 0 0 0 2-2v-.5h1a1 1 0 1 0 0-2h-1V8.5h1a1 1 0 0 0 0-2h-1V6a2 2 0 0 0-2-2V5.5a1 1 0 0 0-2 0V4H8V3.5a1 1 0 0 0-2 0V4Z" clip-rule="evenodd"/></svg>
        <!-- Danger -->
        <svg v-else-if="t.icon === 'danger'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd"/></svg>

        <span>{{ t.label }}</span>
      </button>
    </nav>

    <!-- ══════════════════════════════════════════════
         TAB: CONTRASEÑA
    ══════════════════════════════════════════════ -->
    <div v-if="activeTab === 'password'" class="cfg-panel">
      <div class="panel-title">
        <h2>Cambiar contraseña</h2>
        <p>Usa una contraseña segura que no utilices en otros sitios.</p>
      </div>

      <div class="cfg-form">
        <!-- Contraseña actual -->
        <div class="field-group">
          <label>Contraseña actual</label>
          <div class="input-wrap">
            <input
              :type="showPwd.current ? 'text' : 'password'"
              v-model="pwd.current"
              placeholder="••••••••"
            />
            <button class="eye-btn" @click="showPwd.current = !showPwd.current" type="button">
              <svg v-if="!showPwd.current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/><path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clip-rule="evenodd"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.091 1.092a4 4 0 0 0-5.557-5.557Z" clip-rule="evenodd"/><path d="M10.748 13.93l2.523 2.523a10.003 10.003 0 0 1-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 0 1 0-1.186A10.007 10.007 0 0 1 2.839 6.02L6.07 9.252a4 4 0 0 0 4.678 4.678Z"/></svg>
            </button>
          </div>
        </div>

        <!-- Nueva -->
        <div class="field-group">
          <label>Nueva contraseña</label>
          <div class="input-wrap">
            <input
              :type="showPwd.next ? 'text' : 'password'"
              v-model="pwd.next"
              placeholder="••••••••"
            />
            <button class="eye-btn" @click="showPwd.next = !showPwd.next" type="button">
              <svg v-if="!showPwd.next" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/><path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clip-rule="evenodd"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.091 1.092a4 4 0 0 0-5.557-5.557Z" clip-rule="evenodd"/><path d="M10.748 13.93l2.523 2.523a10.003 10.003 0 0 1-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 0 1 0-1.186A10.007 10.007 0 0 1 2.839 6.02L6.07 9.252a4 4 0 0 0 4.678 4.678Z"/></svg>
            </button>
          </div>
          <!-- Strength bar -->
          <div v-if="pwd.next" class="strength-bar-wrap">
            <div class="strength-bar">
              <div
                class="strength-fill"
                :style="{ width: (strength / passwordRequirements.length * 100) + '%', background: strengthColor }"
              ></div>
            </div>
            <span class="strength-label" :style="{ color: strengthColor }">{{ strengthLabel }}</span>
          </div>
          <ul v-if="pwd.next" class="strength-hints">
            <li v-for="check in passwordChecks" :key="check.id" :class="{ met: check.met }">
              {{ check.label }}
            </li>
          </ul>
          <p v-if="passwordHint" class="password-hint">{{ passwordHint }}</p>
        </div>

        <!-- Confirmar -->
        <div class="field-group">
          <label>Confirmar contraseña</label>
          <div class="input-wrap">
            <input
              :type="showPwd.confirm ? 'text' : 'password'"
              v-model="pwd.confirm"
              placeholder="••••••••"
            />
            <button class="eye-btn" @click="showPwd.confirm = !showPwd.confirm" type="button">
              <svg v-if="!showPwd.confirm" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/><path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clip-rule="evenodd"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.091 1.092a4 4 0 0 0-5.557-5.557Z" clip-rule="evenodd"/><path d="M10.748 13.93l2.523 2.523a10.003 10.003 0 0 1-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 0 1 0-1.186A10.007 10.007 0 0 1 2.839 6.02L6.07 9.252a4 4 0 0 0 4.678 4.678Z"/></svg>
            </button>
          </div>
        </div>

        <div v-if="pwdMsg" :class="['form-msg', pwdSuccess ? 'success' : 'error']">{{ pwdMsg }}</div>
        <button class="btn-primary" @click="updatePassword" :disabled="isPwdUpdating">
          {{ isPwdUpdating ? 'Actualizando...' : 'Actualizar contraseña' }}
        </button>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════
         TAB: CORREO
    ══════════════════════════════════════════════ -->
    <div v-if="activeTab === 'email'" class="cfg-panel">
      <div class="panel-title">
        <h2>Cambiar correo electrónico</h2>
        <p>Se enviará un código de verificación al nuevo correo para confirmar el cambio.</p>
      </div>

      <div class="cfg-form">
        <div class="field-group">
          <label>Correo actual</label>
          <div class="input-readonly">{{ currentEmail }}</div>
        </div>

        <div class="field-group">
          <label>Nuevo correo</label>
          <div class="field-group">
            <input type="email" v-model="newEmail" placeholder="nuevo@correo.com" />
          </div>
          <button class="btn-primary" @click="sendCode" :disabled="isEmailUpdating" style="margin-top: 10px; width: fit-content;">
            {{ isEmailUpdating ? 'Actualizando...' : 'Actualizar correo' }}
          </button>
        </div>


        <div v-if="emailMsg" :class="['form-msg', emailSuccess ? 'success' : 'error']">{{ emailMsg }}</div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════
         TAB: MÉTODOS DE PAGO
    ══════════════════════════════════════════════ -->
    <div v-if="activeTab === 'payments'" class="cfg-panel">
      <div class="panel-title-row">
        <div>
          <h2>Métodos de pago</h2>
          <p>Gestiona las tarjetas vinculadas a tu cuenta.</p>
        </div>
        <button class="btn-primary sm" @click="showAddCard = !showAddCard">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"/></svg>
          Agregar tarjeta
        </button>
      </div>

      <!-- Lista de tarjetas -->
      <div v-if="cards.length > 0" class="cards-grid">
        <div v-for="card in cards" :key="card.id" :class="['payment-card', card.brand?.toLowerCase()]">
          <div class="card-top">
            <div class="card-chip">
              <svg viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="28" rx="4" fill="gold" fill-opacity="0.7"/>
                <rect x="0" y="10" width="36" height="8" fill="gold" fill-opacity="0.4"/>
                <rect x="10" y="0" width="8" height="28" fill="gold" fill-opacity="0.4"/>
              </svg>
            </div>
            <span class="card-brand-label">{{ (card.brand || 'Card').toUpperCase() }}</span>
          </div>
          <div class="card-number">•••• •••• •••• {{ card.last4 }}</div>
          <div class="card-info-row">
             <div class="card-holder">
               <span class="card-meta-label">Titular</span>
               <span class="card-meta-val">{{ card.holder_name || 'Nombre no disponible' }}</span>
             </div>
             <div class="card-expiry">
               <span class="card-meta-label">Vence</span>
               <span class="card-meta-val">{{ card.exp }}</span>
             </div>
          </div>
          <button class="card-delete-btn" @click="removeCard(card.id)" title="Eliminar tarjeta">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4Z" clip-rule="evenodd"/></svg>
          </button>
        </div>
      </div>

      <div v-else class="no-cards-placeholder">
        <div class="placeholder-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75-10.5h16.5a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5V5.25a1.5 1.5 0 0 1 1.5-1.5Z" /></svg>
        </div>
        <p>No tienes tarjetas guardadas.</p>
        <span>Las tarjetas que agregues al realizar una solicitud aparecerán aquí.</span>
      </div>

      <!-- Agregar tarjeta -->
      <div v-if="showAddCard" class="add-card-form">
        <h3>Nueva tarjeta</h3>
        <CreditCardFields
          v-model="newCard"
          :busy="isCardUpdating"
          :error-message="cardMsg"
          submit-text="Guardar tarjeta"
          @submit="addCard"
          @cancel="showAddCard = false; cardMsg = ''"
        />
        <div v-if="false" class="cfg-form">
          <div class="field-group">
            <label>Número de tarjeta</label>
            <input type="text" v-model="newCard.number" placeholder="0000 0000 0000 0000" maxlength="19" />
          </div>
          <div class="field-group">
            <label>Nombre en la tarjeta</label>
            <input type="text" v-model="newCard.name" placeholder="Nombre Apellido" />
          </div>
          <div class="two-col">
            <div class="field-group">
              <label>Vencimiento</label>
              <input type="text" v-model="newCard.exp" placeholder="MM/AA" maxlength="5" />
            </div>
            <div class="field-group">
              <label>CVV</label>
              <input type="text" v-model="newCard.cvv" placeholder="•••" maxlength="4" />
            </div>
          </div>
          <div v-if="cardMsg" class="form-msg error">{{ cardMsg }}</div>
          <div class="btn-row">
            <button class="btn-outline" @click="showAddCard = false; cardMsg = ''">Cancelar</button>
            <button class="btn-primary" @click="addCard" :disabled="isCardUpdating">
              {{ isCardUpdating ? 'Guardando...' : 'Guardar tarjeta' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════
         TAB: 2FA
    ══════════════════════════════════════════════ -->
    <div v-if="activeTab === 'twofa'" class="cfg-panel">
      <div class="panel-title">
        <h2>Verificación en dos pasos</h2>
        <p>Añade una capa extra de seguridad a tu cuenta.</p>
      </div>

      <div class="twofa-card">
        <div class="twofa-row">
          <div class="twofa-info">
            <div class="twofa-status-dot" :class="twofa.enabled ? 'on' : 'off'"></div>
            <div>
              <strong>Estado actual</strong>
              <span :class="['twofa-badge', twofa.enabled ? 'badge-on' : 'badge-off']">
                {{ twofa.enabled ? 'Activado' : 'Desactivado' }}
              </span>
            </div>
          </div>
          <button :class="['toggle-btn', { active: twofa.enabled }]" @click="toggleTwoFA">
            <span class="toggle-circle"></span>
          </button>
        </div>

        <div v-if="twofa.enabled" class="twofa-options">
          <p class="options-label">Método de verificación</p>
          <div class="method-cards">
            <label :class="['method-card', { selected: twofa.method === 'sms' }]">
              <input type="radio" v-model="twofa.method" value="sms" @change="twofa.showQR = false" hidden />
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" clip-rule="evenodd"/></svg>
              <span>SMS</span>
            </label>
            <label :class="['method-card', { selected: twofa.method === 'app' }]">
              <input type="radio" v-model="twofa.method" value="app" @change="twofa.showQR = true" hidden />
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V3.5A1.5 1.5 0 0 0 15.5 2h-11Zm0 1.5h11v13h-11v-13Zm5.5 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd"/></svg>
              <span>App autenticadora</span>
            </label>
          </div>

          <div v-if="twofa.showQR" class="qr-section">
            <p class="qr-text">Escanea este código QR con tu app autenticadora (Google Authenticator, Authy, etc.)</p>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=otpauth://totp/ServiHub:usuario@example.com?secret=JBSWY3DPEHPK3PXP&issuer=ServiHub" class="qr-img" alt="QR Code" />
            <p class="qr-hint">Clave manual: <code>JBSWY3DP EHPK3PXP</code></p>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════
         TAB: SESIONES
    ══════════════════════════════════════════════ -->
    <div v-if="activeTab === 'sessions'" class="cfg-panel">
      <div class="panel-title-row">
        <div>
          <h2>Sesiones activas</h2>
          <p>Dispositivos conectados a tu cuenta en este momento.</p>
        </div>
        <button class="btn-outline-danger" @click="closeOtherSessions" :disabled="isSessionsUpdating">
          {{ isSessionsUpdating ? 'Cerrando...' : 'Cerrar otras sesiones' }}
        </button>
      </div>

      <div class="sessions-list">
        <div v-for="s in sessions" :key="s.id" :class="['session-row', { 'session-current': s.current }]">
          <div class="session-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M2 4.25A2.25 2.25 0 0 1 4.25 2h11.5A2.25 2.25 0 0 1 18 4.25v8.5A2.25 2.25 0 0 1 15.75 15h-3.105a3.501 3.501 0 0 0 1.1 1.677A.75.75 0 0 1 13.26 18H6.74a.75.75 0 0 1-.484-1.323A3.501 3.501 0 0 0 7.355 15H4.25A2.25 2.25 0 0 1 2 12.75v-8.5Zm1.5 0a.75.75 0 0 1 .75-.75h11.5a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-.75.75H4.25a.75.75 0 0 1-.75-.75v-7.5Z" clip-rule="evenodd"/></svg>
          </div>
          <div class="session-info">
            <div class="session-top">
              <span class="session-device">{{ s.device }}</span>
              <span v-if="s.current" class="badge-current">Este dispositivo</span>
            </div>
            <div class="session-meta">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="meta-icon"><path fill-rule="evenodd" d="m7.539 14.841.003.003.002.002a.755.755 0 0 0 .912 0l.002-.002.003-.003.012-.009a5.57 5.57 0 0 0 .19-.153 15.588 15.588 0 0 0 2.046-2.082c1.101-1.362 2.291-3.342 2.291-5.597A5 5 0 0 0 3 7c0 2.255 1.19 4.235 2.292 5.597a15.591 15.591 0 0 0 2.046 2.082 8.08 8.08 0 0 0 .201.162ZM8 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" clip-rule="evenodd"/></svg>
              {{ s.location }}
              <span class="session-sep">·</span>
              {{ s.time }}
            </div>
          </div>
          <button v-if="!s.current" class="session-close-btn" @click="closeSession(s.id)">Cerrar</button>
        </div>

        <div v-if="sessions.length === 1" class="sessions-empty">
          No hay otras sesiones activas.
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════
         TAB: ZONA PELIGROSA
    ══════════════════════════════════════════════ -->
    <div v-if="activeTab === 'danger'" class="cfg-panel">
      <div class="panel-title">
        <h2>Zona peligrosa</h2>
        <p>Estas acciones son irreversibles. Procede con precaución.</p>
      </div>

      <div class="danger-cards">
        <!-- Desactivar -->
        <div class="danger-item">
          <div class="danger-item-info">
            <h4>Desactivar cuenta</h4>
            <p>Tu perfil dejará de ser visible temporalmente. Podrás reactivarla cuando quieras.</p>
          </div>
          <button class="btn-warn" @click="showDeactivateModal = true">Desactivar cuenta</button>
        </div>

        <!-- Eliminar -->
        <div class="danger-item danger-item-delete">
          <div class="danger-item-info">
            <h4>Eliminar cuenta</h4>
            <p>Se borrarán permanentemente todos tus datos, perfil, portafolio y conversaciones. Esta acción no puede deshacerse.</p>
          </div>
          <button class="btn-danger" @click="showDeleteModal = true">Eliminar cuenta</button>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════
         MODAL: ELIMINAR CUENTA
    ══════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-backdrop" @click.self="showDeleteModal = false">
        <div class="modal-box danger-modal">
          <div class="modal-icon-wrap delete">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd"/></svg>
          </div>
          <h3>¿Eliminar tu cuenta?</h3>
          <p>Esta acción es permanente e irreversible. Escribe <strong>ELIMINAR</strong> para confirmar.</p>
          <input type="text" v-model="confirmDelete" placeholder="ELIMINAR" class="confirm-input" />
          <div class="modal-actions">
            <button class="btn-outline" @click="showDeleteModal = false; confirmDelete = ''">Cancelar</button>
            <button
              class="btn-danger"
              :disabled="confirmDelete !== 'ELIMINAR' || isDeleting"
              @click="deleteAccount"
            >{{ isDeleting ? 'Eliminando...' : 'Sí, eliminar mi cuenta' }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- MODAL: DESACTIVAR -->
    <Teleport to="body">
      <div v-if="showDeactivateModal" class="modal-backdrop" @click.self="showDeactivateModal = false">
        <div class="modal-box">
          <h3>Desactivar cuenta temporalmente</h3>
          <p>Tu perfil dejará de aparecer para los clientes. Podrás reactivarla iniciando sesión nuevamente.</p>
          <div class="modal-actions">
            <button class="btn-outline" @click="showDeactivateModal = false">Cancelar</button>
            <button class="btn-warn" @click="deactivateAccount" :disabled="isDeactivating">
              {{ isDeactivating ? 'Desactivando...' : 'Confirmar desactivación' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<style scoped>
/* ─── LAYOUT ──── */
.cfg-container { font-family: 'Inter', sans-serif; max-width: 820px; margin: 0 auto; padding-bottom: 60px; }

/* ─── HEADER ──── */
.cfg-header { margin-bottom: 28px; }
.cfg-title { font-size: 1.6rem; font-weight: 800; color: #0F172A; margin: 0 0 4px; }
.cfg-subtitle { font-size: 0.88rem; color: #94A3B8; margin: 0; }

/* ─── TABS ──── */
.cfg-tabs { display: flex; flex-wrap: wrap; gap: 4px; background: white; border: 1px solid #E2E8F0; border-radius: 10px; padding: 6px; margin-bottom: 24px; }
.cfg-tab { display: flex; align-items: center; gap: 7px; padding: 9px 14px; border-radius: 7px; border: none; background: none; color: #64748B; font-size: 0.84rem; font-weight: 600; cursor: pointer; transition: all 0.18s; white-space: nowrap; }
.cfg-tab svg { width: 15px; height: 15px; }
.cfg-tab:hover { background: #F1F5F9; color: #334155; }
.cfg-tab.active { background: #1E293B; color: white; }
.cfg-tab.danger { color: #DC2626; }
.cfg-tab.danger:hover { background: #FEF2F2; }
.cfg-tab.danger.active { background: #DC2626; color: white; }

/* ─── PANEL ──── */
.cfg-panel { background: white; border: 1px solid #E2E8F0; border-radius: 12px; padding: 32px; }

.panel-title { margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid #F1F5F9; }
.panel-title h2 { font-size: 1.1rem; font-weight: 800; color: #0F172A; margin: 0 0 4px; }
.panel-title p { font-size: 0.85rem; color: #94A3B8; margin: 0; }

.panel-title-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid #F1F5F9; flex-wrap: wrap; gap: 12px; }
.panel-title-row h2 { font-size: 1.1rem; font-weight: 800; color: #0F172A; margin: 0 0 4px; }
.panel-title-row p { font-size: 0.85rem; color: #94A3B8; margin: 0; }

/* ─── FORM ──── */
.cfg-form { display: flex; flex-direction: column; gap: 20px; }
.field-group { display: flex; flex-direction: column; gap: 6px; }
.field-group label { font-size: 0.78rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.07em; }
.field-group input { padding: 11px 14px; border: 1.5px solid #E2E8F0; border-radius: 8px; font-size: 0.93rem; font-family: inherit; color: #1E293B; background: white; transition: border-color 0.2s; width: 100%; box-sizing: border-box; }
.field-group input:focus { border-color: #475569; background: white; outline: none; box-shadow: 0 0 0 3px rgba(71,85,105,0.1); }

.input-wrap { position: relative; }
.input-wrap input { padding-right: 44px; }
.eye-btn { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #94A3B8; padding: 4px; display: flex; align-items: center; }
.eye-btn svg { width: 18px; height: 18px; }
.eye-btn:hover { color: #475569; }

.input-row { display: flex; gap: 10px; }
.input-row input { flex: 1; }
.code-input { letter-spacing: 0.3em; font-weight: 700; font-size: 1.1rem; text-align: center; max-width: 160px; }

.input-readonly { padding: 11px 14px; border: 1.5px solid #E2E8F0; border-radius: 8px; font-size: 0.93rem; color: #64748B; background: white; }

.hint-text { font-size: 0.78rem; color: #94A3B8; margin-top: 4px; }

.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

.btn-row { display: flex; gap: 10px; justify-content: flex-end; }

/* ─── STRENGTH ──── */
.strength-bar-wrap { display: flex; align-items: center; gap: 10px; margin-top: 6px; }
.strength-bar { flex: 1; height: 5px; background: #E2E8F0; border-radius: 99px; overflow: hidden; }
.strength-fill { height: 100%; border-radius: 99px; transition: width 0.35s, background 0.35s; }
.strength-label { font-size: 0.75rem; font-weight: 700; min-width: 64px; }

.strength-hints { list-style: none; padding: 0; margin: 4px 0 0; display: flex; flex-wrap: wrap; gap: 6px 16px; }
.strength-hints li { font-size: 0.76rem; color: #94A3B8; display: flex; align-items: center; gap: 4px; }
.strength-hints li::before { content: '○'; font-size: 0.7rem; }
.strength-hints li.met { color: #22C55E; }
.strength-hints li.met::before { content: '●'; }
.password-hint { margin: 4px 0 0; color: #DC2626; font-size: 0.78rem; font-weight: 700; }

/* ─── BUTTONS ──── */
.btn-primary { display: inline-flex; align-items: center; gap: 6px; background: #1E293B; color: white; border: none; padding: 11px 22px; border-radius: 8px; font-weight: 700; font-size: 0.88rem; cursor: pointer; transition: 0.18s; }
.btn-primary:hover { background: #0F172A; }
.btn-primary.sm { padding: 8px 16px; font-size: 0.82rem; }
.btn-primary svg { width: 15px; height: 15px; }

.btn-outline { display: inline-flex; align-items: center; gap: 6px; background: white; color: #475569; border: 1.5px solid #E2E8F0; padding: 10px 18px; border-radius: 8px; font-weight: 600; font-size: 0.88rem; cursor: pointer; transition: 0.18s; }
.btn-outline:hover { border-color: #CBD5E1; color: #1E293B; }
.btn-outline:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-outline-danger { display: inline-flex; align-items: center; gap: 6px; background: white; color: #DC2626; border: 1.5px solid #FECACA; padding: 9px 16px; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: 0.18s; }
.btn-outline-danger:hover { background: #FEF2F2; border-color: #DC2626; }

.btn-danger { display: inline-flex; align-items: center; gap: 6px; background: #DC2626; color: white; border: none; padding: 11px 22px; border-radius: 8px; font-weight: 700; font-size: 0.88rem; cursor: pointer; transition: 0.18s; }
.btn-danger:hover { background: #B91C1C; }
.btn-danger:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-warn { display: inline-flex; align-items: center; gap: 6px; background: #F59E0B; color: white; border: none; padding: 11px 20px; border-radius: 8px; font-weight: 700; font-size: 0.88rem; cursor: pointer; transition: 0.18s; }
.btn-warn:hover { background: #D97706; }

/* ─── FEEDBACK ──── */
.form-msg { padding: 10px 14px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; }
.form-msg.success { background: #F0FDF4; color: #15803D; border: 1px solid #BBF7D0; }
.form-msg.error   { background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; }

/* ─── PAYMENT CARDS ──── */
.cards-grid { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
.payment-card {
  width: 280px; border-radius: 16px; padding: 22px 22px 18px;
  background: linear-gradient(135deg, #1E293B 0%, #334155 100%);
  color: white; position: relative; overflow: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,0.18);
}
.payment-card.mastercard { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); }
.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
.card-chip svg { width: 36px; height: 28px; }
.card-brand-label { font-size: 0.75rem; font-weight: 800; letter-spacing: 0.15em; opacity: 0.7; }
.card-number { font-family: 'Courier New', monospace; font-size: 1.1rem; font-weight: 700; letter-spacing: 0.15em; margin-bottom: 16px; }
.card-info-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; }
.card-holder { flex: 1; min-width: 0; margin-right: 12px; }
.card-holder .card-meta-val { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px; }
.card-expiry { flex-shrink: 0; text-align: right; }
.card-meta-label { display: block; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.6; }
.card-meta-val { font-size: 0.9rem; font-weight: 700; }
.card-delete-btn { background: rgba(255,255,255,0.15); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; position: absolute; top: 12px; right: 12px; }
.card-delete-btn:hover { background: rgba(239,68,68,0.7); }
.card-delete-btn svg { width: 14px; height: 14px; }

.no-cards-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; background: #F8FAFC; border: 2px dashed #E2E8F0; border-radius: 12px; text-align: center; margin-bottom: 24px; }
.placeholder-icon { width: 48px; height: 48px; color: #94A3B8; margin-bottom: 16px; }
.no-cards-placeholder p { font-size: 1.05rem; font-weight: 700; color: #334155; margin: 0 0 6px; }
.no-cards-placeholder span { font-size: 0.85rem; color: #64748B; max-width: 280px; line-height: 1.5; }

.add-card-form { border: 1.5px dashed #CBD5E1; border-radius: 10px; padding: 24px; background: #FAFBFC; }
.add-card-form h3 { font-size: 0.95rem; font-weight: 700; color: #334155; margin: 0 0 20px; }

/* ─── 2FA ──── */
.twofa-card { border: 1px solid #E2E8F0; border-radius: 10px; padding: 24px; }
.twofa-row { display: flex; justify-content: space-between; align-items: center; }
.twofa-info { display: flex; align-items: center; gap: 12px; }
.twofa-status-dot { width: 10px; height: 10px; border-radius: 50%; }
.twofa-status-dot.on { background: #22C55E; box-shadow: 0 0 0 3px rgba(34,197,94,0.2); }
.twofa-status-dot.off { background: #94A3B8; }
.twofa-info strong { display: block; font-size: 0.95rem; color: #1E293B; margin-bottom: 3px; }
.twofa-badge { display: inline-block; font-size: 0.72rem; font-weight: 700; padding: 2px 10px; border-radius: 99px; }
.badge-on { background: #DCFCE7; color: #15803D; }
.badge-off { background: #F1F5F9; color: #64748B; }

.toggle-btn { width: 48px; height: 26px; background: #CBD5E1; border: none; border-radius: 99px; cursor: pointer; position: relative; transition: background 0.2s; padding: 0; flex-shrink: 0; }
.toggle-btn.active { background: #1E293B; }
.toggle-circle { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; background: white; border-radius: 50%; transition: transform 0.2s; display: block; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
.toggle-btn.active .toggle-circle { transform: translateX(22px); }

.twofa-options { margin-top: 24px; padding-top: 20px; border-top: 1px solid #F1F5F9; }
.options-label { font-size: 0.78rem; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 12px; }
.method-cards { display: flex; gap: 12px; flex-wrap: wrap; }
.method-card { display: flex; align-items: center; gap: 10px; padding: 12px 20px; border: 1.5px solid #E2E8F0; border-radius: 8px; cursor: pointer; font-size: 0.88rem; font-weight: 600; color: #475569; transition: 0.18s; }
.method-card svg { width: 18px; height: 18px; }
.method-card:hover { border-color: #CBD5E1; }
.method-card.selected { border-color: #1E293B; background: #F8FAFC; color: #1E293B; }

.qr-section { margin-top: 20px; display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 24px; background: #F8FAFC; border-radius: 10px; border: 1px solid #E2E8F0; }
.qr-text { font-size: 0.85rem; color: #475569; text-align: center; margin: 0; }
.qr-img { width: 180px; height: 180px; border-radius: 8px; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.qr-hint { font-size: 0.78rem; color: #94A3B8; margin: 0; }
.qr-hint code { background: #E2E8F0; padding: 2px 8px; border-radius: 4px; font-weight: 700; color: #334155; }

/* ─── SESSIONS ──── */
.sessions-list { display: flex; flex-direction: column; gap: 2px; }
.session-row { display: flex; align-items: center; gap: 16px; padding: 16px; border-radius: 10px; border: 1px solid transparent; transition: background 0.15s; }
.session-row:hover { background: #F8FAFC; }
.session-current { border-color: #E2E8F0; background: #F8FAFC; }
.session-icon { width: 38px; height: 38px; background: #F1F5F9; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #475569; }
.session-icon svg { width: 18px; height: 18px; }
.session-info { flex: 1; min-width: 0; }
.session-top { display: flex; align-items: center; gap: 8px; margin-bottom: 3px; flex-wrap: wrap; }
.session-device { font-size: 0.9rem; font-weight: 600; color: #1E293B; }
.badge-current { background: #DCFCE7; color: #15803D; font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 99px; }
.session-meta { font-size: 0.78rem; color: #94A3B8; display: flex; align-items: center; gap: 4px; }
.meta-icon { width: 12px; height: 12px; }
.session-sep { margin: 0 2px; }
.session-close-btn { background: white; border: 1.5px solid #E2E8F0; color: #64748B; padding: 6px 14px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; flex-shrink: 0; transition: 0.18s; }
.session-close-btn:hover { border-color: #94A3B8; color: #1E293B; }
.sessions-empty { text-align: center; color: #94A3B8; font-size: 0.88rem; padding: 24px; }

/* ─── DANGER ZONE ──── */
.danger-cards { display: flex; flex-direction: column; gap: 16px; }
.danger-item { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 22px; border: 1px solid #E2E8F0; border-radius: 10px; flex-wrap: wrap; }
.danger-item-delete { border-color: #FECACA; background: #FFFAFA; }
.danger-item-info h4 { font-size: 0.95rem; font-weight: 700; color: #1E293B; margin: 0 0 4px; }
.danger-item-delete .danger-item-info h4 { color: #DC2626; }
.danger-item-info p { font-size: 0.83rem; color: #64748B; margin: 0; max-width: 440px; line-height: 1.5; }

/* ─── MODALS ──── */
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.45); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal-box { background: white; border-radius: 14px; padding: 32px; max-width: 440px; width: 100%; box-shadow: 0 20px 50px rgba(0,0,0,0.2); text-align: center; }
.modal-box h3 { font-size: 1.1rem; font-weight: 800; color: #0F172A; margin: 0 0 10px; }
.modal-box p { font-size: 0.9rem; color: #64748B; margin: 0 0 20px; line-height: 1.6; }
.modal-icon-wrap { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
.modal-icon-wrap.delete { background: #FEF2F2; color: #DC2626; }
.modal-icon-wrap svg { width: 28px; height: 28px; }
.confirm-input { width: 100%; padding: 10px 14px; border: 1.5px solid #E2E8F0; border-radius: 8px; font-size: 0.95rem; font-weight: 700; text-align: center; letter-spacing: 0.15em; margin-bottom: 20px; box-sizing: border-box; }
.confirm-input:focus { border-color: #DC2626; outline: none; box-shadow: 0 0 0 3px rgba(220,38,38,0.1); }
.modal-actions { display: flex; gap: 10px; justify-content: center; }

/* ─── RESPONSIVE ──── */
@media (max-width: 640px) {
  .cfg-panel { padding: 20px; }
  .input-row { flex-direction: column; }
  .payment-card { width: 100%; }
  .two-col { grid-template-columns: 1fr; }
  .danger-item { flex-direction: column; align-items: flex-start; }
  .modal-actions { flex-direction: column; }
  .cfg-tabs { gap: 2px; }
  .cfg-tab span { display: none; }
}
</style>
