describe('Pruebas E2E Visuales - Interfaz de Login', () => {
  it('1. El Robot debe escribir como un humano en los campos de texto', () => {
    // 1. Visitamos la página de Login
    cy.visit('/login');

    // 2. Comprueba visualmente que estamos en el lugar correcto
    cy.get('h2').contains('Iniciar Sesión').should('be.visible');

    // 3. El robot "teclea" la información
    cy.get('input[type="email"]').type('robot_visual@gmail.com', { delay: 100 });
    cy.get('input[type="password"]').type('MiPasswordSecreto123', { delay: 100 });

    // 4. Verifica que el botón de Entrar esté activo y listo para clickear
    cy.get('button[type="submit"]').contains('Entrar').should('not.be.disabled');
  });

  it('2. El Robot debe detectar errores visuales al enviar el formulario vacío', () => {
    cy.visit('/login');
    
    // El robot da click directo sin llenar datos
    cy.get('button[type="submit"]').click();

    // Comprobamos que el cuadro rojo de error aparece en la pantalla
    cy.get('.error-msg')
      .should('be.visible')
      .and('contain', 'Por favor completa todos los campos');
  });
});
