<template>
  <div class="setup-container">
    <header class="setup-header">
      <div class="logo">SERVIHUB</div>
    </header>

    <div class="form-wrapper">
      <div class="form-card">
        <h2>Completa tu Perfil Profesional</h2>
        <p class="subtitle">Para que los clientes te encuentren y confíen en ti.</p>

        <form @submit.prevent="saveProfile">
          
          <div class="form-section">
            <div class="profile-upload">
              <div class="avatar-preview">
                <span v-if="!form.avatar">📷</span>
                <img v-else :src="form.avatar" alt="Preview" />
              </div>
              <button type="button" class="btn-upload">Subir Foto</button>
            </div>

            <div class="input-group">
              <label for="profession">Tu Profesión o Título</label>
              <input 
                type="text" 
                id="profession" 
                v-model="form.profession" 
                placeholder="Ej. Plomero Certificado, Técnico de PC..." 
                required
              />
            </div>

            <div class="input-group">
              <label for="bio">Biografía Breve</label>
              <textarea 
                id="bio" 
                v-model="form.bio" 
                placeholder="Cuéntale a los clientes sobre tu experiencia..." 
                rows="3"
              ></textarea>
            </div>
          </div>

          <div class="form-section">
            <div class="input-group">
              <label for="category">Categoría Principal</label>
              <select id="category" v-model="form.category" required>
                <option value="" disabled selected>Selecciona una opción</option>
                <option value="hogar">Hogar y Reparaciones</option>
                <option value="tecnologia">Tecnología e Informática</option>
                <option value="educacion">Clases y Educación</option>
                <option value="belleza">Belleza y Cuidado</option>
              </select>
            </div>

            <div class="input-group">
              <label for="phone">Teléfono de Contacto (WhatsApp)</label>
              <input 
                type="tel" 
                id="phone" 
                v-model="form.phone" 
                placeholder="Ej. 809-555-5555" 
              />
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary">Guardar y Continuar</button>
          </div>

        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import './ProfessionalSetup.css'; // Importamos tu CSS separado aquí

const router = useRouter();

const form = reactive({
  avatar: null,
  profession: '',
  bio: '',
  category: '',
  phone: ''
});

const saveProfile = () => {
  // Aquí iría la lógica para enviar los datos a tu Backend (Node.js)
  console.log('Guardando perfil:', form);
  
  // Simulación de redirección al siguiente paso (Crear primer post)
  router.push('/create-first-post'); 
};
</script>