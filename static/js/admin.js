let originalLibroData = {}; 
document.addEventListener('DOMContentLoaded', async function() {
    document.querySelector('#adminSection').style.display = 'none';

    // Handle sidebar navigation
    const sidebarLinks = document.querySelectorAll('.sidebar__link');
    const panels = document.querySelectorAll('.panel');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            sidebarLinks.forEach(l => l.classList.remove('sidebar__link--active'));
            link.classList.add('sidebar__link--active');
            
            panels.forEach(panel => panel.classList.remove('active'));
            const panelId = link.getAttribute('href').substring(1);
            document.getElementById(panelId).classList.add('active');
        });
    });

    // Mobile menu toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('sidebar--open');
        });
    }

    // Cargar portada cuando el ISBN pierda el foco
    const isbnInput = document.getElementById('isbn');
    if (isbnInput) {
        isbnInput.addEventListener('blur', function() {
            cargarPortadaDesdeISBN(this.value, 'portadaAgregar');
        });
    }

    // Manejar el formulario de agregar libro
    const formLibro = document.getElementById('formLibro');
    formLibro.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const isbn = document.getElementById('isbn').value.trim();
        
        // Verificar si el ISBN ya existe
        try {
            const response = await fetch(`/api/libros/buscar-isbn?isbn=${isbn}`);
            const data = await response.json();
            
            if (response.ok && data && data.encontrado) {
                // Mostrar modal con los detalles del libro existente
                mostrarModalIsbnDuplicado(data.libro);
                return;
            }
            
            // Si no existe, proceder con el registro normal
            const libroData = {
                titulo: document.getElementById('titulo').value,
                autor: document.getElementById('autor').value,
                anio: document.getElementById('anio').value,
                isbn: isbn,
                categoria: document.getElementById('categoria').value,
                descripcion: document.getElementById('descripcion').value,
                stock: parseInt(document.getElementById('stock').value) || 0,
            };

            const submitResponse = await fetch('/api/libros', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(libroData)
            });

            const submitData = await submitResponse.json();

            if (submitResponse.ok) {
                formLibro.reset();
                document.getElementById('portadaAgregar').src = '/static/covers/no-cover.png';
                showToast('¡Libro agregado exitosamente!', 'success');
                await actualizarEstadisticas();
            } else {
                showToast(submitData.error || 'Error al agregar el libro', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Error al conectar con el servidor', 'error');
        }
    });

    // Manejar el formulario de registro de usuario
    const formUsuario = document.getElementById('formUsuario');
    formUsuario.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const userData = {
            nombre: document.getElementById('nombre').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value, // Add password field
            privilegios: document.getElementById('privilegios').value
        };

        try {
            const response = await fetch('/api/usuarios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (response.ok) {
                formUsuario.reset();
                showToast('Usuario registrado exitosamente', 'success');
                await actualizarEstadisticas();
            } else {
                showToast(data.error || 'Error al registrar usuario', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Error al conectar con el servidor', 'error');
        }
    });

    // Agregar manejadores de búsqueda para préstamos
    const searchPrestamo = document.getElementById('searchPrestamo');
    const searchUsuarioPrestamo = document.getElementById('searchUsuarioPrestamo');
    const resultadosPrestamo = document.getElementById('resultadosPrestamo');
    const resultadosUsuarioPrestamo = document.getElementById('resultadosUsuarioPrestamo');
    const formPrestamo = document.getElementById('formPrestamo');

    // Búsqueda de libros para préstamo
    searchPrestamo.addEventListener('input', async function() {
        const searchTerm = this.value.trim();
        if (searchTerm.length < 2) {
            resultadosPrestamo.innerHTML = '';
            return;
        }

        try {
            const response = await fetch(`/api/libros/buscar?q=${searchTerm}`);
            const libros = await response.json();
            console.log(libros);
            
            resultadosPrestamo.style.display = 'block';
            resultadosPrestamo.innerHTML = libros
                .filter(libro => libro.estado === 'disponible')
                .map(libro => `
                    <a href="#" class="a-search" data-id="${libro.id}">
                        <div class="search__card">
                            <div class="search__image">
                                <img src="/static/img/loading.gif" 
                                    alt="${libro.titulo}" 
                                    class="search--img"
                                    data-isbn="${libro.isbn}">
                            </div>
                            <div class="search__content">
                                <div class="search__text">${libro.titulo}</div>
                                <p class="search__autor">${libro.autor}</p>
                            </div>
                            <div class="search__estado ${getEstadoClass(libro.estado)}">
                                ${libro.estado.toUpperCase()}
                            </div>
                        </div>
                    </a>
                `).join('');

            // Agregar eventos click a los resultados
            resultadosPrestamo.querySelectorAll('.a-search').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    document.getElementById('idLibro').value = item.dataset.id;
                    searchPrestamo.value = item.querySelector('.search__text').textContent;
                    resultadosPrestamo.innerHTML = '';
                    resultadosPrestamo.style.display = 'none';
                });
            });
            
            // Cargar las imágenes después de crear los elementos
            const imgElements = resultadosPrestamo.querySelectorAll('.search--img');
            imgElements.forEach(async (img) => {
                const isbn = img.dataset.isbn;
                const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
                await loadImageWithFallback(img, coverUrl);
            });
        } catch (error) {
            console.error('Error:', error);
            showToast('Error al buscar libros', 'error');
        }
    });

    // Búsqueda de usuarios para préstamo
    searchUsuarioPrestamo.addEventListener('input', async function() {
        const searchTerm = this.value.trim();
        if (searchTerm.length < 2) {
            resultadosUsuarioPrestamo.innerHTML = '';
            return;
        }

        try {
            const response = await fetch(`/api/usuarios/buscar?q=${searchTerm}`);
            const usuarios = await response.json();
            
            resultadosUsuarioPrestamo.style.display = 'block';
            resultadosUsuarioPrestamo.innerHTML = usuarios.map(usuario => `
                <a href="#" class="a-search" data-id="${usuario.id}">
                    <div class="search__card">
                        <div class="search__content">
                            <div class="search__text">${usuario.nombre}</div>
                            <p class="search__autor">${usuario.email}</p>
                        </div>
                    </div>
                </a>
            `).join('');

            // Agregar eventos click a los resultados
            resultadosUsuarioPrestamo.querySelectorAll('.a-search').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    document.getElementById('idUsuario').value = item.dataset.id;
                    searchUsuarioPrestamo.value = item.querySelector('.search__text').textContent;
                    resultadosUsuarioPrestamo.innerHTML = '';
                    resultadosUsuarioPrestamo.style.display = 'none';
                });
            });
        } catch (error) {
            console.error('Error:', error);
            showToast('Error al buscar usuarios', 'error');
        }
    });

    // Manejar el préstamo de libros
    formPrestamo.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (idLibro.value === '' || idUsuario.value === '') {
            showToast('Por favor seleccione un libro y un usuario', 'warning');
            return;
        }
        
        const prestamoData = {
            idLibro: document.getElementById('idLibro').value,
            idUsuario: document.getElementById('idUsuario').value
        };

        try {
            const response = await fetch('/api/prestamos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(prestamoData)
            });

            const data = await response.json();

            if (response.ok) {
                formPrestamo.reset();
                searchPrestamo.value = '';
                searchUsuarioPrestamo.value = '';
                showToast('¡Préstamo realizado exitosamente!', 'success');
                actualizarEstadisticas();
                cargarPrestamosActivos();
            } else {
                showToast(data.error || 'Error al realizar el préstamo', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Error al conectar con el servidor', 'error');
        }
    });

    // Inicializar las funcionalidades de préstamos y devoluciones
    await cargarPrestamosActivos();
    await cargarSolicitudesPendientes();
    await actualizarEstadisticas();
    document.querySelector('.main-content').style = 'visibility: visible;';

    // Event listener para búsqueda de devoluciones
    const searchDevolucion = document.getElementById('searchDevolucion');
    const resultadosDevolucion = document.getElementById('resultadosDevolucion');
    const formDevolucion = document.getElementById('formDevolucion');

    searchDevolucion?.addEventListener('input', async function() {
        const searchTerm = this.value.trim();
        if (searchTerm.length < 2) {
            resultadosDevolucion.innerHTML = '';
            return;
        }

        try {
            const response = await fetch(`/api/prestamos/buscar?q=${searchTerm}`);
            const prestamos = await response.json();    
            resultadosDevolucion.style.display = 'block';
            resultadosDevolucion.innerHTML = prestamos.map(prestamo => `
                <a href="#" class="a-search" data-id="${prestamo.libro_id}" data-usuario-id="${prestamo.usuario_id}">
                    <div class="search__card">
                        <div class="search__image">
                            <img src="/static/img/loading.gif" 
                                alt="${prestamo.titulo}" 
                                class="search--img"
                                data-isbn="${prestamo.isbn}">
                        </div>
                        <div class="search__content">
                            <div class="search__text">${prestamo.titulo}</div>
                            <p class="search__autor">${prestamo.nombre_usuario}</p>
                            <p class="search__autor">Prestado: ${new Date(prestamo.fecha_prestamo).toLocaleDateString()}</p>
                        </div>
                        <div class="search__estado estado-prestado">
                            PRESTADO
                        </div>
                    </div>
                </a>
            `).join('');

            resultadosDevolucion.querySelectorAll('.a-search').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    document.getElementById('idLibroDev').value = item.dataset.id;
                    document.getElementById('idUsuarioDev').value = item.dataset.usuarioId;
                    searchDevolucion.value = item.querySelector('.search__text').textContent;
                    resultadosDevolucion.innerHTML = '';
                    resultadosDevolucion.style.display = 'none';
                });
            });
            
            // Cargar las imágenes después de crear los elementos
            const imgElements = resultadosDevolucion.querySelectorAll('.search--img');
            imgElements.forEach(async (img) => {
                const isbn = img.dataset.isbn;
                const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
                await loadImageWithFallback(img, coverUrl);
            });
        } catch (error) {
            console.error('Error:', error);
            showToast('Error al buscar préstamos', 'error');
        }
    });

    // Event listener para el formulario de devolución
    formDevolucion?.addEventListener('submit', async function(e) {
        e.preventDefault();

        const libroId = document.getElementById('idLibroDev').value;
        const usuarioId = document.getElementById('idUsuarioDev').value;

        if (!libroId || !usuarioId) {
            showToast('Por favor seleccione un libro y usuario', 'warning');
            return;
        }

        try {
            const response = await fetch(`/api/prestamos/buscar-activo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    libro_id: libroId,
                    usuario_id: usuarioId
                })
            });

            const data = await response.json();

            if (response.ok && data.prestamo_id) {
                // Si encontramos el préstamo activo, procedemos a devolverlo
                await devolverLibro(data.prestamo_id);
                this.reset();
                searchDevolucion.value = '';
                showToast('Libro devuelto exitosamente', 'success');
                await actualizarEstadisticas();
            } else {
                showToast(data.error || 'No se encontró un préstamo activo para este libro y usuario', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Error al procesar la devolución', 'error');
        }
    });

    // Gestionar libros
    const searchGestionar = document.getElementById('searchGestionar');
    const resultadosGestionar = document.getElementById('resultadosGestionar');
    const formGestionar = document.getElementById('formGestionar');
    const btnEliminar = document.getElementById('btnEliminar');

    searchGestionar?.addEventListener('input', async function() {
        const searchTerm = this.value.trim();
        if (searchTerm.length < 2) {
            resultadosGestionar.innerHTML = '';
            return;
        }

        try {
            const response = await fetch(`/api/libros/buscar?q=${searchTerm}`);
            const libros = await response.json();
            
            resultadosGestionar.style.display = 'block';
            resultadosGestionar.innerHTML = libros.map(libro => `
                <a href="#" class="a-search" data-id="${libro.id}">
                    <div class="search__card">
                        <div class="search__image">
                            <img src="/static/img/loading.gif" 
                                alt="${libro.titulo}" 
                                class="search--img"
                                data-isbn="${libro.isbn}">
                        </div>
                        <div class="search__content">
                            <div class="search__text">${libro.titulo}</div>
                            <p class="search__autor">${libro.autor}</p>
                        </div>
                        <div class="search__estado ${getEstadoClass(libro.estado)}">
                            ${libro.estado.toUpperCase()}
                        </div>
                    </div>
                </a>
            `).join('');

            resultadosGestionar.querySelectorAll('.a-search').forEach(item => {
                item.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const libroId = item.dataset.id;
                    await cargarDetallesLibro(libroId);
                    resultadosGestionar.innerHTML = '';
                    resultadosGestionar.style.display = 'none';
                    searchGestionar.value = item.querySelector('.search__text').textContent;
                });
            });
            
            // Cargar las imágenes después de crear los elementos
            const imgElements = resultadosGestionar.querySelectorAll('.search--img');
            imgElements.forEach(async (img) => {
                const isbn = img.dataset.isbn;
                const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
                await loadImageWithFallback(img, coverUrl);
            });
        } catch (error) {
            console.error('Error:', error);
            showToast('Error al buscar libros', 'error');
        }
    });

    formGestionar?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const libroId = document.getElementById('libroId').value;
        if (!libroId) {
            showToast('Por favor seleccione un libro primero', 'warning');
            return;
        }

        const libroData = {
            titulo: document.getElementById('tituloGestionar').value,
            autor: document.getElementById('autorGestionar').value,
            anio:  parseInt(document.getElementById('anioGestionar').value) || 0,
            isbn: document.getElementById('isbnGestionar').value,
            categoria: document.getElementById('categoriaGestionar').value,
            descripcion: document.getElementById('descripcionGestionar').value,
            estado: document.getElementById('estadoGestionar').value.toLowerCase(),
            stock: parseInt(document.getElementById('stockGestionar').value) || 0
        };

        console.log("Form data:", libroData);
        console.log("Original data for comparison:", originalLibroData);

        // Check if there are any changes
        const hasChanges = 
            libroData.titulo !== originalLibroData.titulo ||
            libroData.autor !== originalLibroData.autor ||
            libroData.anio !== originalLibroData.anio ||
            libroData.isbn !== originalLibroData.isbn ||
            libroData.categoria !== originalLibroData.categoria ||
            libroData.descripcion !== originalLibroData.descripcion ||
            libroData.estado !== originalLibroData.estado ||
            libroData.stock !== originalLibroData.stock;

        console.log("Has changes:", hasChanges);

        if (!hasChanges) {
            showToast('No se han realizado cambios en la información del libro', 'info');
            return;
        }

        try {
            const response = await fetch(`/api/libros/${libroId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(libroData)
            });

            const data = await response.json();
            if (response.ok) {
                document.getElementById('cardGestionar').style.visibility = 'hidden';
                window.scrollTo(0, 0);
                showToast('Libro actualizado exitosamente', 'success');
                await actualizarEstadisticas();
                // Update original data after successful update
                originalLibroData = {...libroData};
            } else {
                showToast(data.error || 'Error al actualizar el libro', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Error al conectar con el servidor', 'error');
        }
    });

    // Setup modal controls
    const setupModalControls = function() {
        // Book deletion modal controls
        const deleteBookModal = document.getElementById('deleteBookModal');
        const bookModalClose = deleteBookModal.querySelector('.modal-close');
        const cancelDeleteBook = document.getElementById('cancelDeleteBook');
        const confirmDeleteBook = document.getElementById('confirmDeleteBook');
        
        // Add missing event listener for delete button
        const btnEliminar = document.getElementById('btnEliminar');
        if (btnEliminar) {
            btnEliminar.addEventListener('click', function() {
                const libroId = document.getElementById('libroId').value;
                if (!libroId) {
                    showToast('No hay libro seleccionado para eliminar', 'warning');
                    return;
                }
                
                // Populate modal with book information
                const titulo = document.getElementById('tituloGestionar').value;
                const autor = document.getElementById('autorGestionar').value;
                
                document.getElementById('deleteBookTitle').textContent = titulo;
                document.getElementById('deleteBookAuthor').textContent = autor;
                
                // Set the book ID on the confirm button
                confirmDeleteBook.setAttribute('data-id', libroId);
                
                // Show the modal
                deleteBookModal.style.display = 'block';
            });
        }
        
        bookModalClose.addEventListener('click', function() {
            deleteBookModal.style.display = 'none';
        });
        
        cancelDeleteBook.addEventListener('click', function() {
            deleteBookModal.style.display = 'none';
        });
        
        confirmDeleteBook.addEventListener('click', async function() {
            const libroId = this.getAttribute('data-id');
            window.scrollTo(0, 0);
            deleteBookModal.style.display = 'none';
            
            try {
                const response = await fetch(`/api/libros/${libroId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    document.getElementById('formGestionar').reset();
                    document.getElementById('cardGestionar').style.visibility = 'hidden';
                    showToast('Libro eliminado exitosamente', 'success');
                    await actualizarEstadisticas();
                } else {
                    const data = await response.json();
                    showToast(data.error || 'Error al eliminar el libro', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showToast('Error al conectar con el servidor', 'error');
            }
        });
        
        // User deletion modal controls
        const deleteUserModal = document.getElementById('deleteUserModal');
        const userModalClose = deleteUserModal.querySelector('.modal-close');
        const cancelDeleteUser = document.getElementById('cancelDeleteUser');
        const confirmDeleteUser = document.getElementById('confirmDeleteUser');
        
        userModalClose.addEventListener('click', function() {
            deleteUserModal.style.display = 'none';
        });
        
        cancelDeleteUser.addEventListener('click', function() {
            deleteUserModal.style.display = 'none';
        });
        
        confirmDeleteUser.addEventListener('click', async function() {
            const userId = this.getAttribute('data-id');
            deleteUserModal.style.display = 'none';
            window.scrollTo(0, 0);
            
            try {
                const response = await fetch(`/api/usuarios/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                const data = await response.json();

                if (response.ok) {
                    document.getElementById('formEliminarUsuario').reset();
                    document.getElementById('searchUsuarioEliminar').value = '';
                    showToast('Usuario eliminado exitosamente', 'success');
                    await actualizarEstadisticas();
                } else {
                    showToast(data.error || 'Error al eliminar usuario', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showToast('Error al conectar con el servidor', 'error');
            }
        });
        
        // Close modals when clicking outside
        window.addEventListener('click', function(e) {
            if (e.target === deleteBookModal) {
                deleteBookModal.style.display = 'none';
            }
            if (e.target === deleteUserModal) {
                deleteUserModal.style.display = 'none';
            }
        });
    };

    // Call this at the end of DOMContentLoaded
    setupModalControls();

    // Validación personalizada para campos requeridos
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(event) {
            let isValid = true;
            
            // Validar todos los campos requeridos
            form.querySelectorAll('input[required], select[required], textarea[required]').forEach(field => {
                if (!field.value.trim()) {
                    field.classList.add('invalid');
                    isValid = false;
                } else {
                    field.classList.remove('invalid');
                }
            });
            
            if (!isValid) {
                event.preventDefault();
                event.stopPropagation();
                showToast('Por favor complete todos los campos requeridos', 'warning');
            }
        });
        
        // Eliminar clase 'invalid' al escribir
        form.querySelectorAll('input, select, textarea').forEach(field => {
            field.addEventListener('input', function() {
                if (this.value.trim()) {
                    this.classList.remove('invalid');
                }
            });
        });
    });

    // Configurar eventos del modal
    const modal = document.getElementById('isbnDuplicateModal');
    const closeBtn = document.querySelector('.modal-close');
    const btnCerrarModal = document.getElementById('btnCerrarModal');
    const btnVerLibro = document.getElementById('btnVerLibro');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', cerrarModal);
    }
    
    if (btnCerrarModal) {
        btnCerrarModal.addEventListener('click', cerrarModal);
    }
    
    if (btnVerLibro) {
        btnVerLibro.addEventListener('click', function() {
            const libroId = this.getAttribute('data-id');
            if (libroId) {
                // Cambiar a la pestaña de gestionar y cargar el libro
                const gestionarLink = document.querySelector('a[href="#gestionar"]');
                if (gestionarLink) {
                    gestionarLink.click();
                    
                    // Esperar a que la pestaña se active y luego cargar el libro
                    setTimeout(async () => {
                        await cargarDetallesLibro(libroId);
                        cerrarModal();
                    }, 300);
                }
            }
        });
    }
    
    // Cerrar el modal al hacer clic fuera de él
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            cerrarModal();
        }
    });

    // Agregar evento al botón de generar descripción
    const btnGenerarDescripcion = document.getElementById('btnGenerarDescripcion');
    if (btnGenerarDescripcion) {
        btnGenerarDescripcion.addEventListener('click', generarDescripcionLibro);
    }

    // Después de todos los event listeners pero antes del final del DOMContentLoaded
    // Agregar manejadores para la búsqueda y eliminación de usuarios
    const searchUsuarioEliminar = document.getElementById('searchUsuarioEliminar');
    const resultadosUsuarioEliminar = document.getElementById('resultadosUsuarioEliminar');
    const formEliminarUsuario = document.getElementById('formEliminarUsuario');

    // Búsqueda de usuarios para eliminar
    searchUsuarioEliminar?.addEventListener('input', async function() {
        const searchTerm = this.value.trim();
        if (searchTerm.length < 2) {
            resultadosUsuarioEliminar.innerHTML = '';
            return;
        }

        try {
            const response = await fetch(`/api/usuarios/buscar?q=${searchTerm}`);
            const usuarios = await response.json();
            
            resultadosUsuarioEliminar.style.display = 'block';
            resultadosUsuarioEliminar.innerHTML = usuarios.map(usuario => `
                <a href="#" class="a-search" data-id="${usuario.id}" data-nombre="${usuario.nombre}" data-email="${usuario.email}">
                    <div class="search__card">
                        <div class="search__content">
                            <div class="search__text">${usuario.nombre}</div>
                            <p class="search__autor">${usuario.email}</p>
                        </div>
                    </div>
                </a>
            `).join('');

            // Agregar eventos click a los resultados
            resultadosUsuarioEliminar.querySelectorAll('.a-search').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    document.getElementById('idUsuarioEliminar').value = item.dataset.id;
                    document.getElementById('nombreUsuarioEliminar').value = item.dataset.nombre;
                    document.getElementById('emailUsuarioEliminar').value = item.dataset.email;
                    searchUsuarioEliminar.value = item.querySelector('.search__text').textContent;
                    resultadosUsuarioEliminar.innerHTML = '';
                    resultadosUsuarioEliminar.style.display = 'none';
                });
            });
        } catch (error) {
            console.error('Error:', error);
            showToast('Error al buscar usuarios', 'error');
        }
    });

    // Manejar el formulario de eliminación de usuario
    formEliminarUsuario?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const userId = document.getElementById('idUsuarioEliminar').value;
        if (!userId) {
            showToast('Por favor seleccione un usuario para eliminar', 'warning');
            return;
        }

        // Open the delete user confirmation modal instead of using confirm()
        const userName = document.getElementById('nombreUsuarioEliminar').value;
        const userEmail = document.getElementById('emailUsuarioEliminar').value;
        
        // Populate the modal with user details
        document.getElementById('deleteUserName').textContent = userName;
        document.getElementById('deleteUserEmail').textContent = userEmail;
        
        // Open the modal
        const modal = document.getElementById('deleteUserModal');
        modal.style.display = 'block';
        
        // Store the user ID for the confirmation button to use
        document.getElementById('confirmDeleteUser').setAttribute('data-id', userId);
    });

    // Handle ISBN changes in the Gestionar tab to update book cover
    const isbnGestionarField = document.getElementById('isbnGestionar');
    const portadaGestionar = document.getElementById('portadaGestionar');

    if (isbnGestionarField && portadaGestionar) {
        // Add event listener for ISBN changes in Gestionar tab
        isbnGestionarField.addEventListener('change', function() {
            updateBookCoverByISBN(isbnGestionarField, portadaGestionar);
        });
        
        isbnGestionarField.addEventListener('input', function() {
            // Optional: Use a debounce function here to avoid too many API calls
            // For simplicity, we're using setTimeout
            clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(() => {
                updateBookCoverByISBN(isbnGestionarField, portadaGestionar);
            }, 500); // Wait 500ms after typing stops
        });
    }

    // Ensure the ISBN field in the Agregar tab also uses the new reusable function
    const isbnField = document.getElementById('isbn');
    const portadaAgregar = document.getElementById('portadaAgregar');

    if (isbnField && portadaAgregar) {
        isbnField.addEventListener('change', function() {
            updateBookCoverByISBN(isbnField, portadaAgregar);
        });
        
        isbnField.addEventListener('input', function() {
            clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(() => {
                updateBookCoverByISBN(isbnField, portadaAgregar);
            }, 500);
        });
    }
});

// Función para cargar la portada desde un ISBN
async function cargarPortadaDesdeISBN(isbn, imgElementId) {
    if (!isbn || isbn.trim() === '') return;
    
    const imgElement = document.getElementById(imgElementId);
    if (!imgElement) return;
    
    // Mostrar imagen de carga
    imgElement.src = '/static/img/loading.gif';
    
    try {
        // Intentar cargar la portada desde OpenLibrary
        const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn.trim()}-L.jpg`;
        const loaded = await loadImageWithFallback(imgElement, coverUrl, '/static/covers/no-cover.png');
        
        if (!loaded) {
            showToast('No se encontró portada para el ISBN proporcionado', 'warning');
        }
    } catch (error) {
        console.error('Error al cargar la portada:', error);
        imgElement.src = '/static/covers/no-cover.png';
        showToast('Error al cargar la portada', 'error');
    }
}

// Funciones para manejar préstamos activos

// Variables globales para paginación
let currentPage = 1;
const itemsPerPage = 5;
let allPrestamos = [];

async function cargarPrestamosActivos() {
    try {
        const response = await fetch('/api/prestamos/activos');
        allPrestamos = await response.json();
        
        // Seleccionamos todas las tablas que muestran préstamos activos
        const tablasPrestamos = document.querySelectorAll('#tablaPrestamos');
        
        if (tablasPrestamos.length === 0) return;

        // Paginación
        const totalPages = Math.ceil(allPrestamos.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, allPrestamos.length);
        const prestamosToShow = allPrestamos.slice(startIndex, endIndex);

        // Generar HTML para los préstamos de la página actual
        const prestamosHTML = prestamosToShow.map(prestamo => `
            <tr>
                <td>${prestamo.titulo}</td>
                <td>${prestamo.nombre_usuario}</td>
                <td>${new Date(prestamo.fecha_prestamo).toLocaleDateString()}</td>
                <td>${prestamo.libro_id}</td>
                <td>${prestamo.usuario_id}</td>
                <td>
                    <button onclick="devolverLibro(${prestamo.id})" class="btn btn--small btn--warning">
                        Devolver
                    </button>
                </td>
            </tr>
        `).join('');

        // Crear controles de paginación
        const paginationHTML = `
            <tr class="pagination-row">
                <td colspan="6">
                    <div class="pagination-controls">
                        <button onclick="cambiarPagina(${currentPage - 1})" class="btn btn--small" ${currentPage === 1 ? 'disabled' : ''}>
                            &laquo; Anterior
                        </button>
                        <span class="pagination-info">Página ${currentPage} de ${totalPages || 1}</span>
                        <button onclick="cambiarPagina(${currentPage + 1})" class="btn btn--small" ${currentPage >= totalPages ? 'disabled' : ''}>
                            Siguiente &raquo;
                        </button>
                    </div>
                </td>
            </tr>
        `;

        // Actualizamos todas las tablas con los mismos datos y controles de paginación
        tablasPrestamos.forEach(tabla => {
            tabla.innerHTML = prestamosHTML;
            
            // Si no hay préstamos, mostrar mensaje
            if (allPrestamos.length === 0) {
                tabla.innerHTML = `<tr><td colspan="6" class="empty-message">No hay préstamos activos</td></tr>`;
            } 
            // Si hay préstamos, agregar controles de paginación solo si hay más de itemsPerPage préstamos
            else if (allPrestamos.length > itemsPerPage) {
                tabla.innerHTML += paginationHTML;
            }
        });
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al cargar préstamos activos', 'error');
    }
}

// Función para cambiar de página
function cambiarPagina(newPage) {
    const totalPages = Math.ceil(allPrestamos.length / itemsPerPage);
    
    // Validar que la página solicitada sea válida
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        cargarPrestamosActivos();
    }
}

// Función para devolver un libro
async function devolverLibro(prestamoId) {
    try {
        const response = await fetch(`/api/prestamos/${prestamoId}/devolver`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        if (response.ok) {
            showToast('Libro devuelto exitosamente', 'success');
            currentPage = 1; // Resetear a la primera página
            await cargarPrestamosActivos();
            await actualizarEstadisticas();
        } else {
            showToast(data.error || 'Error al devolver el libro', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al conectar con el servidor', 'error');
    }
}

// Funciones para manejar solicitudes pendientes
async function cargarSolicitudesPendientes() {
    try {
        const response = await fetch('/api/solicitudes/pendientes');
        const solicitudes = await response.json();
        const tablaSolicitudes = document.getElementById('solicitudesPendientes');
        tablaSolicitudes.innerHTML = solicitudes.map(solicitud => `
            <tr>
                <td>${solicitud.nombre_usuario}</td>
                <td>${solicitud.titulo_libro}</td>
                <td>${new Date(solicitud.fecha_solicitud).toLocaleDateString()}</td>
                <td>${solicitud.estado}</td>
                <td>
                    <button onclick="gestionarSolicitud(${solicitud.id}, 'aprobada')" class="btn btn--small btn--success">
                        Aprobar
                    </button>
                    <button onclick="gestionarSolicitud(${solicitud.id}, 'denegada')" class="btn btn--small btn--danger">
                        Rechazar
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al cargar solicitudes', 'error');
    }
}

async function gestionarSolicitud(id, estado) {
    try {
        const response = await fetch(`/api/solicitudes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ estado })
        });

        const data = await response.json();
        if (response.ok) {
            showToast('Solicitud actualizada exitosamente', 'success');
            await cargarSolicitudesPendientes();
            await actualizarEstadisticas();
        } else {
            showToast(data.error || 'Error al actualizar la solicitud', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al conectar con el servidor', 'error');
    }
    cargarPrestamosActivos();
}

// Función para actualizar estadísticas
async function actualizarEstadisticas() {
    try {
        const response = await fetch('/api/estadisticas');
        const stats = await response.json();
        
        // Update statistics in dashboard
        document.getElementById('totalTitulos').textContent = stats.libros.total_titulos || 0;
        document.getElementById('totalEjemplares').textContent = stats.libros.total_ejemplares || 0;
        document.getElementById('ejemplaresDisponibles').textContent = stats.libros.ejemplares_disponibles || 0;
        document.getElementById('librosAgotados').textContent = stats.libros.libros_agotados || 0;
        document.getElementById('librosConStock').textContent = stats.libros.libros_con_stock || 0;
        document.getElementById('solicitudesPendientesCount').textContent = stats.actividad.solicitudes_pendientes || 0;
        document.getElementById('prestamosActivosCount').textContent = stats.actividad.prestamos_activos || 0;
        document.getElementById('totalUsuariosCount').textContent = stats.usuarios.total || 0;
        document.getElementById('usuariosConPrestamosCount').textContent = stats.usuarios.con_prestamos || 0;
        
        // Update duplicated statistics in the statistics panel
        if (document.getElementById('totalTitulos2')) {
            document.getElementById('totalTitulos2').textContent = stats.libros.total_titulos || 0;
            document.getElementById('ejemplaresDisponibles2').textContent = stats.libros.ejemplares_disponibles || 0;
            document.getElementById('librosAgotados2').textContent = stats.libros.libros_agotados || 0;
            document.getElementById('solicitudesPendientesCount2').textContent = stats.actividad.solicitudes_pendientes || 0;
            document.getElementById('prestamosActivosCount2').textContent = stats.actividad.prestamos_activos || 0;
            document.getElementById('totalUsuariosCount2').textContent = stats.usuarios.total || 0;
        }
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        showToast('Error al cargar estadísticas', 'error');
    }
}

async function cargarDetallesLibro(id) {
    try {
        const response = await fetch(`/api/libros/${id}`);
        const libro = await response.json();
        
        document.getElementById('libroId').value = libro.id;
        document.getElementById('idLibroGestionar').value = libro.id; // Actualizar el campo visible
        document.getElementById('tituloGestionar').value = libro.titulo;
        document.getElementById('autorGestionar').value = libro.autor;
        document.getElementById('anioGestionar').value = libro.anio;
        document.getElementById('isbnGestionar').value = libro.isbn;
        document.getElementById('categoriaGestionar').value = libro.categoria;
        document.getElementById('descripcionGestionar').value = libro.descripcion;
        document.getElementById('estadoGestionar').value = libro.estado;
        document.getElementById('stockGestionar').value = libro.stock;
        
        // Store original values for comparison - normalize data types to match form submission
        originalLibroData = {
            titulo: libro.titulo,
            autor: libro.autor,
            anio: parseInt(libro.anio),
            isbn: libro.isbn,
            categoria: libro.categoria,
            descripcion: libro.descripcion,
            estado: libro.estado.toLowerCase(), 
            stock: parseInt(libro.stock) || 0   
        };
        
        console.log("Original data loaded:", originalLibroData);
        
        // Set the book cover
        const portadaImg = document.getElementById('portadaGestionar');
        portadaImg.src = '/static/covers/no-cover.png'; // Default image
        
        // Try to load the cover from OpenLibrary
        if (libro.isbn) {
            const coverUrl = `https://covers.openlibrary.org/b/isbn/${libro.isbn}-L.jpg`;
            await loadImageWithFallback(portadaImg, coverUrl, '/static/covers/no-cover.png');
        }
        
        // Make the card visible
        document.getElementById('cardGestionar').style.visibility = 'visible';
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al cargar detalles del libro', 'error');
    }
}

// Add the missing functions from main.js
function getEstadoClass(estado) {
    switch(estado) {
        case 'disponible': return 'estado-disponible';
        case 'solicitado': return 'estado-solicitado';
        case 'agotado': return 'estado-agotado';
        case 'mantenimiento': return 'estado-mantenimiento';
        default: return '';
    }
}

async function loadImageWithFallback(imgElement, imageUrl, fallbackUrl = '/static/covers/no-cover.png') {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            // Verificar si la imagen es válida (no es una imagen de error predeterminada)
            if (img.width > 1) {
                imgElement.src = imageUrl;
                resolve(true);
            } else {
                imgElement.src = fallbackUrl;
                resolve(false);
            }
        };
        img.onerror = () => {
            imgElement.src = fallbackUrl;
            resolve(false);
        };
        img.src = imageUrl;
    });
}

// Add a missing showToast function if it's not defined in main.js
if (typeof showToast !== 'function') {
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('toast--visible');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('toast--visible');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

function cerrarModal() {
    const modal = document.getElementById('isbnDuplicateModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function mostrarModalIsbnDuplicado(libro) {
    // Llenar el modal con los datos del libro existente
    document.getElementById('modalTitulo').textContent = libro.titulo || '';
    document.getElementById('modalAutor').textContent = libro.autor || '';
    document.getElementById('modalAnio').textContent = libro.anio || '';
    document.getElementById('modalCategoria').textContent = libro.categoria || '';
    document.getElementById('modalIsbn').textContent = libro.isbn || '';
    document.getElementById('modalStock').textContent = libro.stock || '0';
    document.getElementById('modalEstado').textContent = libro.estado || '';
    
    // Configurar el botón para ver detalles
    const btnVerLibro = document.getElementById('btnVerLibro');
    if (btnVerLibro) {
        btnVerLibro.setAttribute('data-id', libro.id);
    }
    
    // Cargar la portada del libro
    const portadaImg = document.getElementById('modalPortada');
    if (portadaImg && libro.isbn) {
        portadaImg.src = '/static/img/loading.gif';
        const coverUrl = `https://covers.openlibrary.org/b/isbn/${libro.isbn}-L.jpg`;
        loadImageWithFallback(portadaImg, coverUrl, '/static/covers/no-cover.png');
    }
    
    // Mostrar el modal
    const modal = document.getElementById('isbnDuplicateModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Función para generar una descripción de libro usando IA
async function generarDescripcionLibro() {
    // Obtener los valores de los campos necesarios
    const titulo = document.getElementById('titulo').value.trim();
    const autor = document.getElementById('autor').value.trim();
    const anio = document.getElementById('anio').value.trim();
    const categoria = document.getElementById('categoria').value;
    
    // Validar que los campos requeridos estén completos
    if (!titulo || !autor || !anio) {
        showToast('Por favor complete el título, autor y año antes de generar una descripción', 'warning');
        return;
    }
    
    const descriptionField = document.getElementById('descripcion');
    const descriptionContainer = descriptionField.parentElement;
    
    // Crear y mostrar indicador de carga
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'description-loading';
    descriptionContainer.appendChild(loadingIndicator);
    
    try {
        // Crear el prompt para la IA
        const prompt = `Busca un libro con una o mas de las siguientes características y dame su descripción:
            - Título: "${titulo}"
            - Autor: "${autor}"
            - Año de publicación: ${anio}
            ${categoria ? `- Categoría: ${categoria}` : ''}
            
            La descripción debe ser atractiva e informativa. No más de 250 palabras. En español, Usa Texto plano y en un SOLO PARRAFO`;
        
        // Preparar los datos para la API de Groq
        const payload = {
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ]
        };
        
        // Llamar a nuestra API proxy para evitar exponer la clave API en el cliente
        const response = await fetch('/api/ai/generate-description', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            let errorMessage = 'Error al generar la descripción';
            
            if (data && data.error) {
                errorMessage = data.error;
                if (data.message) {
                    errorMessage += ': ' + data.message;
                }
                
                // Si es un problema de configuración de API, dar instrucciones más claras
                if (data.error === 'API key no configurada') {
                    errorMessage = 'La API key de Groq no está configurada en el servidor. Por favor contacte al administrador.';
                }
            }
            
            throw new Error(errorMessage);
        }
        
        // Extraer la respuesta generada
        const generatedText = data.choices[0].message.content;
        
        // Establecer la descripción generada en el campo
        descriptionField.value = generatedText;
        
        showToast('Descripción generada exitosamente', 'success');
    } catch (error) {
        console.error('Error al generar descripción:', error);
        showToast('Error al generar la descripción: ' + error.message, 'error');
    } finally {
        // Eliminar el indicador de carga
        descriptionContainer.removeChild(loadingIndicator);
    }
}
