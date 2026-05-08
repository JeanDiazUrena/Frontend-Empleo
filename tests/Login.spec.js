import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import Login from '../src/views/Login.vue';

// 1. Evitamos que el componente intente cambiar de página realmockeando Vue Router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}));

// 2. Mockeamos la función de 'alert' y otros del navegador
global.alert = vi.fn();

describe('Login.vue - Pruebas de Interfaz Visual (UI Testing)', () => {
  
  it('1. Debe renderizar el formulario visual correctamente', () => {
    // Montamos el componente en el navegador virtual JS DOM
    const wrapper = mount(Login);
    
    // Buscamos los elementos visuales
    const emailInput = wrapper.find('input[type="email"]');
    const passwordInput = wrapper.find('input[type="password"]');
    const submitBtn = wrapper.find('button[type="submit"]');

    // Aserciones: comprobamos que existan en la pantalla
    expect(emailInput.exists()).toBe(true);
    expect(passwordInput.exists()).toBe(true);
    expect(submitBtn.exists()).toBe(true);
  });

  it('2. La interfaz debe reaccionar cuando el usuario teclea (Reactividad de Vue)', async () => {
    const wrapper = mount(Login);
    
    const emailInput = wrapper.find('input[type="email"]');
    const passwordInput = wrapper.find('input[type="password"]');

    // Simulamos un usuario tecleando en tiempo real
    await emailInput.setValue('cliente@test.com');
    await passwordInput.setValue('mi_password_segura');

    // Comprobamos que la interfaz retenga los valores correctamente (V-Model)
    expect(emailInput.element.value).toBe('cliente@test.com');
    expect(passwordInput.element.value).toBe('mi_password_segura');
  });

});
