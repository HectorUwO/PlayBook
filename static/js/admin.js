document.addEventListener('DOMContentLoaded', async function() {
    await setupUserInterface();
    document.querySelector('.navbar__search').style.display = 'none';
    document.querySelector('#adminSection').style.display = 'none';
    const tabs = document.querySelectorAll('.tabs__link');
    const contents = document.querySelectorAll('.tab-content');

    //Mostrar la primera pestaña por defecto
    contents[0].classList.add('active');
    //Manejar las pestañas
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            tabs.forEach(t => t.classList.remove('tabs__link--isActive'));
            tab.classList.add('tabs__link--isActive');
            contents.forEach(content => content.classList.remove('active'));
            const targetId = tab.getAttribute('href').substring(1);
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Manejar el formulario de agregar libro
    const formLibro = document.getElementById('formLibro');
    formLibro.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const libroData = {
            titulo: document.getElementById('titulo').value,
            autor: document.getElementById('autor').value,
            anio: document.getElementById('anio').value,
            isbn: document.getElementById('isbn').value,
            categoria: document.getElementById('categoria').value,
            descripcion: document.getElementById('descripcion').value,
            stock: parseInt(document.getElementById('stock').value) || 0,
        };

        try {
            const response = await fetch('/api/libros', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(libroData)
            });

            const data = await response.json();

            if (response.ok) {
                formLibro.reset();
                showToast('¡Libro agregado exitosamente!', 'success');
            } else {
                showToast(data.error || 'Error al agregar el libro', 'error');
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
            
            resultadosPrestamo.innerHTML = libros
                .filter(libro => libro.estado === 'disponible')
                .map(libro => `
                    <div class="search-result-item" data-id="${libro.id}">
                        <div class="result-title">${libro.titulo}</div>
                        <div class="result-details">
                            <span>${libro.autor}</span>
                            <span class="estado-disponible">Disponible</span>
                        </div>
                    </div>
                `).join('');

            // Agregar eventos click a los resultados
            resultadosPrestamo.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    document.getElementById('idLibro').value = item.dataset.id;
                    searchPrestamo.value = item.querySelector('.result-title').textContent;
                    resultadosPrestamo.innerHTML = '';
                });
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
            
            resultadosUsuarioPrestamo.innerHTML = usuarios.map(usuario => `
                <div class="search-result-item" data-id="${usuario.id}">
                    <div class="result-title">${usuario.nombre}</div>
                    <div class="result-details">
                        <span>${usuario.email}</span>
                    </div>
                </div>
            `).join('');

            // Agregar eventos click a los resultados
            resultadosUsuarioPrestamo.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    document.getElementById('idUsuario').value = item.dataset.id;
                    searchUsuarioPrestamo.value = item.querySelector('.result-title').textContent;
                    resultadosUsuarioPrestamo.innerHTML = '';
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
            
            resultadosDevolucion.innerHTML = prestamos.map(prestamo => `
                <div class="search-result-item" data-id="${prestamo.id}" data-usuario-id="${prestamo.usuario_id}">
                    <div class="result-title">${prestamo.titulo}</div>
                    <div class="result-details">
                        <span>${prestamo.nombre_usuario}</span>
                        <span>Prestado: ${new Date(prestamo.fecha_prestamo).toLocaleDateString()}</span>
                    </div>
                </div>
            `).join('');

            resultadosDevolucion.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    document.getElementById('idLibroDev').value = item.dataset.id;
                    document.getElementById('idUsuarioDev').value = item.dataset.usuarioId;
                    searchDevolucion.value = item.querySelector('.result-title').textContent;
                    resultadosDevolucion.innerHTML = '';
                });
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
            
            resultadosGestionar.innerHTML = libros.map(libro => `
                <div class="search-result-item" data-id="${libro.id}">
                    <div class="result-title">${libro.titulo}</div>
                    <div class="result-details">
                        <span>${libro.autor}</span>
                        <span class="estado-${libro.estado}">${libro.estado}</span>
                    </div>
                </div>
            `).join('');

            resultadosGestionar.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', async () => {
                    const libroId = item.dataset.id;
                    await cargarDetallesLibro(libroId);
                    resultadosGestionar.innerHTML = '';
                    searchGestionar.value = item.querySelector('.result-title').textContent;
                });
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
            anio: document.getElementById('anioGestionar').value,
            isbn: document.getElementById('isbnGestionar').value,
            categoria: document.getElementById('categoriaGestionar').value,
            descripcion: document.getElementById('descripcionGestionar').value,
            estado: document.getElementById('estadoGestionar').value.toLowerCase(),
            stock: parseInt(document.getElementById('stockGestionar').value) || 0
        };

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
                showToast('Libro actualizado exitosamente', 'success');
                await actualizarEstadisticas();
            } else {
                showToast(data.error || 'Error al actualizar el libro', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Error al conectar con el servidor', 'error');
        }
    });

    btnEliminar?.addEventListener('click', async function() {
        const libroId = document.getElementById('libroId').value;
        if (!libroId) {
            showToast('Por favor seleccione un libro primero', 'warning');
            return;
        }

        if (!confirm('¿Está seguro que desea eliminar este libro?')) {
            return;
        }

        try {
            const response = await fetch(`/api/libros/${libroId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                formGestionar.reset();
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
});

// Funciones para manejar préstamos activos
async function cargarPrestamosActivos() {
    try {
        const response = await fetch('/api/prestamos/activos');
        const prestamos = await response.json();
        
        const tablaPrestamos = document.getElementById('tablaPrestamos');
        if (!tablaPrestamos) return;

        tablaPrestamos.innerHTML = prestamos.map(prestamo => `
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
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al cargar préstamos activos', 'error');
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
        
        // Actualizar estadísticas de libros
        document.getElementById('totalTitulos').textContent = stats.libros.total_titulos || 0;
        document.getElementById('totalEjemplares').textContent = stats.libros.total_ejemplares || 0;
        document.getElementById('ejemplaresDisponibles').textContent = stats.libros.ejemplares_disponibles || 0;
        document.getElementById('librosAgotados').textContent = stats.libros.libros_agotados || 0;
        document.getElementById('librosConStock').textContent = stats.libros.libros_con_stock || 0;
        
        // Actualizar estadísticas de actividad
        document.getElementById('solicitudesPendientesCount').textContent = stats.actividad.solicitudes_pendientes || 0;
        document.getElementById('prestamosActivosCount').textContent = stats.actividad.prestamos_activos || 0;
        
        // Actualizar estadísticas de usuarios
        document.getElementById('totalUsuariosCount').textContent = stats.usuarios.total || 0;
        document.getElementById('usuariosConPrestamosCount').textContent = stats.usuarios.con_prestamos || 0;
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
        document.getElementById('tituloGestionar').value = libro.titulo;
        document.getElementById('autorGestionar').value = libro.autor;
        document.getElementById('anioGestionar').value = libro.anio;
        document.getElementById('isbnGestionar').value = libro.isbn;
        document.getElementById('categoriaGestionar').value = libro.categoria;
        document.getElementById('descripcionGestionar').value = libro.descripcion;
        document.getElementById('estadoGestionar').value = libro.estado;
        document.getElementById('stockGestionar').value = libro.stock;
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al cargar detalles del libro', 'error');
    }
}
