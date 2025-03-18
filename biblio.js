"use strict";
// Clase principal que gestiona la biblioteca
class Biblioteca {
    constructor() {
        this.libros = [];
        this.usuarios = [];
        this.siguienteIdLibro = 1;
        this.siguienteIdUsuario = 1;
        this.cargarLibrosJSON();
        this.cargarUsuariosJSON();
    }

    // Método para cargar libros del JSON
    async cargarLibrosJSON() {
        try {
            // Agregamos un timestamp para evitar el caché
            const timestamp = new Date().getTime();
            const response = await fetch(`libros.json?t=${timestamp}`);
            if (!response.ok) {
                throw new Error('Error al cargar los libros');
            }
            const data = await response.json();
            this.libros = data.libros;
            this.siguienteIdLibro = Math.max(...this.libros.map(libro => libro.id)) + 1;
            console.log('Libros cargados exitosamente del JSON');
        } catch (error) {
            console.error('Error al cargar libros del JSON:', error);
        }
    }

    // Agregar método para cargar usuarios
    async cargarUsuariosJSON() {
        try {
            const response = await fetch('users.json');
            const data = await response.json();
            this.usuarios = data.usuarios;
            this.siguienteIdUsuario = Math.max(...this.usuarios.map(user => user.id)) + 1;
            console.log('Usuarios cargados exitosamente del JSON');
        } catch (error) {
            console.error('Error al cargar usuarios del JSON:', error);
            this.usuarios = [];
        }
    }

    // Modificar método para guardar libros
    async guardarLibrosJSON() {
        try {
            const response = await fetch('guardar_datos.php?tipo=libros', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ libros: this.libros })
            });
            
            if (!response.ok) {
                throw new Error('Error al guardar los libros');
            }
            console.log('Libros guardados exitosamente');
        } catch (error) {
            console.error('Error al guardar libros:', error);
        }
    }

    // Modificar método para guardar usuarios
    async guardarUsuariosJSON() {
        try {
            const response = await fetch('guardar_datos.php?tipo=usuarios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ usuarios: this.usuarios })
            });
            
            if (!response.ok) {
                throw new Error('Error al guardar los usuarios');
            }
            console.log('Usuarios guardados exitosamente');
        } catch (error) {
            console.error('Error al guardar usuarios:', error);
        }
    }

    // Método para agregar un nuevo libro
    async agregarLibro(titulo, autor, año, isbn, categoria, descripcion) {
        const nuevoLibro = {
            id: this.siguienteIdLibro++,
            titulo,
            autor,
            año,
            isbn,
            categoria,
            descripcion,
            estado: "Disponible"
        };
        this.libros.push(nuevoLibro);
        await this.guardarLibrosJSON();
        console.log(`Libro "${titulo}" agregado con éxito.`);
    }

    // Actualizar método registrarUsuario para incluir privilegios
    async registrarUsuario(nombre, email, privilegios = 'usuario') {
        const nuevoUsuario = {
            id: this.siguienteIdUsuario++,
            nombre,
            email,
            privilegios,
            librosSolicitados: [],
            librosPrestados: []
        };
        this.usuarios.push(nuevoUsuario);
        await this.guardarUsuariosJSON();
        console.log(`Usuario ${nombre} registrado con éxito como ${privilegios}.`);
        return nuevoUsuario;
    }

    // Actualizar método verificarSolicitudesPendientes
    async verificarSolicitudesPendientes(idUsuario) {
        await this.cargarUsuariosJSON();
        const usuario = this.usuarios.find(u => u.id === idUsuario);
        return usuario?.librosSolicitados?.length > 0 || false;
    }

    // Modificar el método prestarLibro para manejar solicitudes
    async prestarLibro(idLibro, idUsuario) {
        try {
            await this.cargarLibrosJSON();
            await this.cargarUsuariosJSON();

            const libro = this.libros.find(l => l.id === idLibro);
            const usuario = this.usuarios.find(u => u.id === idUsuario);

            if (!libro || !usuario) {
                throw new Error("Libro o usuario no encontrado.");
            }

            if (libro.estado !== "Disponible") {
                throw new Error("El libro no está disponible para solicitud.");
            }

            // Inicializar arrays si no existen
            if (!usuario.librosSolicitados) usuario.librosSolicitados = [];
            if (!usuario.librosPrestados) usuario.librosPrestados = [];

            // Verificar si ya tiene solicitudes pendientes
            if (usuario.librosSolicitados.length > 0) {
                throw new Error("Ya tienes una solicitud pendiente.");
            }

            // Agregar a librosSolicitados
            usuario.librosSolicitados.push({
                id: libro.id,
                titulo: libro.titulo,
                autor: libro.autor,
                fechaSolicitud: new Date().toISOString()
            });

            // Actualizar estado del libro
            libro.estado = "Solicitado";

            await Promise.all([
                this.guardarLibrosJSON(),
                this.guardarUsuariosJSON()
            ]);

            return {
                success: true,
                message: '¡Libro solicitado! Espera a que el administrador procese tu solicitud.'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Método para devolver un libro
    async devolverLibro(idLibro, idUsuario) {
        try {
            // Recargar datos frescos
            await this.cargarLibrosJSON();
            await this.cargarUsuariosJSON();

            // Convertir IDs a números
            idLibro = parseInt(idLibro);
            idUsuario = parseInt(idUsuario);

            const libro = this.libros.find(l => l.id === idLibro);
            const usuario = this.usuarios.find(u => u.id === idUsuario);
            
            if (!libro || !usuario) {
                throw new Error("Libro o usuario no encontrado.");
            }

            // Verificar si el usuario tiene el libro prestado
            const prestamo = usuario.librosPrestados.find(l => parseInt(l.id) === idLibro);
            if (!prestamo) {
                throw new Error("Este usuario no tiene prestado este libro.");
            }

            // Actualizar estado del libro
            libro.estado = "Disponible";
            
            // Eliminar el libro de la lista de préstamos del usuario
            usuario.librosPrestados = usuario.librosPrestados.filter(l => parseInt(l.id) !== idLibro);
            
            // Guardar cambios
            await Promise.all([
                this.guardarLibrosJSON(),
                this.guardarUsuariosJSON()
            ]);
            
            return {
                success: true,
                message: `Libro "${libro.titulo}" devuelto con éxito.`
            };
        } catch (error) {
            console.error('Error en devolverLibro:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }
    // Método para buscar libros por título
    async buscarLibros(titulo) {
        await this.cargarLibrosJSON();
        return this.libros.filter(libro => 
            libro.titulo.toLowerCase().includes(titulo.toLowerCase())
        );
    }
    // Actualizar método obtenerEstadisticas
    async obtenerEstadisticas() {
        await Promise.all([
            this.cargarLibrosJSON(),
            this.cargarUsuariosJSON()
        ]);

        const librosDisponibles = this.libros.filter(l => l.estado === "Disponible").length;
        const librosPrestados = this.libros.filter(l => l.estado === "Prestado").length;
        const librosSolicitados = this.libros.filter(l => l.estado === "Solicitado").length;

        // Contar solicitudes pendientes del array librosSolicitados
        let solicitudesPendientes = 0;
        this.usuarios.forEach(usuario => {
            if (usuario.librosSolicitados) {
                solicitudesPendientes += usuario.librosSolicitados.length;
            }
        });

        return {
            totalLibros: this.libros.length,
            librosDisponibles,
            librosPrestados,
            librosSolicitados,
            solicitudesPendientes,
            totalUsuarios: this.usuarios.length
        };
    }

    verificarSesion() {
        const usuario = sessionStorage.getItem('usuarioActual');
        return usuario ? JSON.parse(usuario) : null;
    }

    // Agregar nuevo método para préstamo directo
    async prestamoDirecto(idLibro, idUsuario) {
        try {
            await this.cargarLibrosJSON();
            await this.cargarUsuariosJSON();

            const libro = this.libros.find(l => l.id === idLibro);
            const usuario = this.usuarios.find(u => u.id === idUsuario);

            if (!libro || !usuario) {
                throw new Error("Libro o usuario no encontrado.");
            }

            if (libro.estado !== "Disponible") {
                throw new Error("El libro no está disponible para préstamo.");
            }

            // Agregar directamente a librosPrestados
            if (!usuario.librosPrestados) usuario.librosPrestados = [];

            usuario.librosPrestados.push({
                id: libro.id,
                titulo: libro.titulo,
                autor: libro.autor,
                fechaPrestamo: new Date().toISOString(),
                estado: 'prestado'
            });

            // Actualizar estado del libro
            libro.estado = "Prestado";

            await Promise.all([
                this.guardarLibrosJSON(),
                this.guardarUsuariosJSON()
            ]);

            return {
                success: true,
                message: `Libro "${libro.titulo}" prestado con éxito a ${usuario.nombre}.`
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
}


const biblioteca = new Biblioteca();

document.addEventListener("DOMContentLoaded", function() {
    cargarLibrosyPortadas("Literatura y novelas");

    // Agregar funcionalidad al botón ¡Sorprendeme!
    const sorprendemeBtn = document.getElementById('sorprendemeBtn');
    if (sorprendemeBtn) {
        sorprendemeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            irALibroAleatorio();
        });
    }

    // Agregar evento de búsqueda
    const searchInput = document.querySelector('.input--search');
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        if (searchTerm === '') {
            let contenedorBusqueda = document.querySelector(".search__container");
            contenedorBusqueda.style.display = "none";
        } else {
            buscarLibros(searchTerm);
        }
    });

    const tabs = document.querySelectorAll('.tabs__link, .tabs__link--isActive');

    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();

            tabs.forEach(t => {
                t.className = 'tabs__link';
            });

            this.className = 'tabs__link--isActive';

            const categoria = this.textContent.trim();

            cargarLibrosyPortadas(categoria);
        });
    });
});

async function cargarLibrosyPortadas(categoria) {
    let contenedor = document.querySelector(".container");
    
    function getCoverUrl(isbn, size = 'L') {
        return `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg`;
    }
    
    function mostrarLibros(libros) {
        contenedor.innerHTML = ''; 
        
        const librosFiltrados = libros.filter(libro => libro.categoria === categoria);

        if (librosFiltrados.length === 0) {
            contenedor.innerHTML = `<p>No hay libros disponibles en la categoría ${categoria}</p>`;
            return;
        }

        librosFiltrados.forEach(libro => {
            const cardHTML = `
                <a href="libro.html?id=${libro.id}" class="nulo">
                    <div class="card">
                        <div class="card__image">
                        <img src="${getCoverUrl(libro.isbn)}" 
                             alt="${libro.titulo}" 
                             class="card--img">
                        </div>
                        <div class="card__title">
                            ${libro.titulo}
                        </div>
                        <div class="card__autor">
                            ${libro.autor}
                        </div>
                        <div class="card__anio">
                            ${libro.año}
                        </div>
                    </div>
                </a>
            `;
            contenedor.innerHTML += cardHTML;
        });
    }
    

    // Cargar y mostrar los libros
    try {
        const response = await fetch('libros.json?t=' + new Date().getTime());
        const data = await response.json();
        const libros = data.libros;
        
        const librosFiltrados = libros.filter(libro => 
            libro.categoria === categoria
        );
        mostrarLibros(librosFiltrados);
    } catch (error) {
        console.error('Error:', error);
        contenedor.innerHTML = '<p>Error al cargar los libros. Por favor, intente más tarde.</p>';
    }
}

async function buscarLibros(termino) {
    let contenedorBusqueda = document.querySelector(".search__container");
    
    try {
        const response = await fetch('libros.json?t=' + new Date().getTime());
        const data = await response.json();
        
        const librosFiltrados = data.libros.filter(libro => 
            libro.titulo.toLowerCase().includes(termino) ||
            libro.autor.toLowerCase().includes(termino)
        );

        if (librosFiltrados.length === 0) {
            contenedorBusqueda.innerHTML = '<p>No se encontraron libros que coincidan con tu búsqueda.</p>';
            return;
        }

        contenedorBusqueda.innerHTML = '';
        contenedorBusqueda.style.display = "block";
        librosFiltrados.forEach(libro => {
            // Determinar clase de estado
            let estadoClase;
            switch(libro.estado) {
                case 'Disponible':
                    estadoClase = 'estado-disponible';
                    break;
                case 'Solicitado':
                    estadoClase = 'estado-solicitado';
                    break;
                case 'Prestado':
                    estadoClase = 'estado-prestado';
                    break;
                default:
                    estadoClase = '';
            }

            const cardHTML = `
            <a href="libro.html?id=${libro.id}" class="a-search">
                <div class="search__card">
                    <div class="search__image">
                        <img src="https://covers.openlibrary.org/b/isbn/${libro.isbn}-L.jpg" alt="" class="search--img">
                    </div>
                    <div class="search__content">
                        <div class="search__text">${libro.titulo}</div>
                        <p class="search__autor">${libro.autor}</p>
                    </div>
                    <div class="search__estado ${estadoClase}">
                        ${libro.estado}
                    </div>
                </div>
            </a>
            `;
            contenedorBusqueda.innerHTML += cardHTML;
        });
    } catch (error) {
        console.error('Error:', error);
        contenedor.innerHTML = '<p>Error al buscar libros. Por favor, intente más tarde.</p>';
    }
}

// Funcion para cargar detalles del libro en libro.html
async function cargarDetallesLibro() {
    try {
        const params = new URLSearchParams(window.location.search);
        const libroId = params.get('id');

        if (!libroId) return;

        const [librosResponse, usuariosResponse] = await Promise.all([
            fetch('libros.json?t=' + new Date().getTime()),
            fetch('users.json?t=' + new Date().getTime())
        ]);

        const [librosData, usuariosData] = await Promise.all([
            librosResponse.json(),
            usuariosResponse.json()
        ]);

        const libro = librosData.libros.find(l => l.id === parseInt(libroId));
        if (!libro) {
            console.error('Libro no encontrado');
            return;
        }

        // Actualizar elementos en la página
        document.querySelector('.title').textContent = `${libro.titulo} (${libro.año})`;
        document.querySelector('.autor').textContent = libro.autor;
        document.querySelector('.images--img').src = `https://covers.openlibrary.org/b/isbn/${libro.isbn}-L.jpg`;
        document.querySelector('.product__details p').textContent = libro.descripcion;
        document.querySelector('.identificador').textContent =  `Id: ${libro.id}`;
        
        // Actualizar el estado y el botón según disponibilidad
        const detallesState = document.querySelector('.details');
        const btnPedir = document.getElementById('btnPedir');
        
        if (libro.estado === "Prestado" || libro.estado === "Solicitado") {
            detallesState.textContent = `No Disponible - ${libro.estado}`;
            detallesState.style.color = "red";
            btnPedir.style.display = 'none';
        } else {
            detallesState.textContent = "Disponible";
            detallesState.style.color = "green";
            btnPedir.style.display = 'block';

            // Verificar si el usuario actual tiene solicitudes pendientes
            const usuario = biblioteca.verificarSesion();
            if (usuario) {
                const tieneSolicitud = await biblioteca.verificarSolicitudesPendientes(usuario.id);
                if (tieneSolicitud) {
                    btnPedir.classList.add('btn--disabled');
                    btnPedir.textContent = 'Ya tienes una solicitud pendiente';
                    btnPedir.disabled = true;
                }
            }
        }

        // Cargar libros relacionados
        const librosRelacionados = librosData.libros.filter(l => 
            l.categoria === libro.categoria && 
            l.id !== libro.id
        ).slice(0, 5); 

        const contenedorRelacionados = document.querySelector('.container');
        contenedorRelacionados.innerHTML = '';
        
        librosRelacionados.forEach(libroRel => {
            const cardHTML = `
                <a href="libro.html?id=${libroRel.id}" class="nulo">
                <div class="card">
                    <div class="card__image">
                    <img src="https://covers.openlibrary.org/b/isbn/${libroRel.isbn}-L.jpg" 
                         alt="${libroRel.titulo}" 
                         class="card--img">
                    </div>
                    <div class="card__title">
                        ${libroRel.titulo}
                    </div>
                    <div class="card__autor">
                        ${libroRel.autor}
                    </div>
                    <div class="card__anio">
                        ${libroRel.año}
                    </div>
                </div>
            </a>
            `;
            contenedorRelacionados.innerHTML += cardHTML;
        });
    } catch (error) {
        console.error('Error al cargar los detalles del libro:', error);
    }
}

// Modificar el event listener del botón en la página de libro
if (window.location.pathname.includes('libro.html')) {
    document.addEventListener('DOMContentLoaded', async () => {
        await cargarDetallesLibro();
        
        const btnPedir = document.getElementById('btnPedir');
        if (!btnPedir) return;

        btnPedir.addEventListener('click', async (e) => {
            e.preventDefault();
            const usuario = biblioteca.verificarSesion();
            if (!usuario) {
                window.location.href = 'login.html';
                return;
            }

            btnPedir.classList.add('btn--disabled');
            btnPedir.textContent = 'Procesando...';

            const params = new URLSearchParams(window.location.search);
            const libroId = parseInt(params.get('id'));
            const resultado = await biblioteca.prestarLibro(libroId, usuario.id);
            const mensajeEstado = document.getElementById('mensajeEstado');
            
            if (resultado.success) {
                mensajeEstado.innerHTML = `<p class="mensaje-exito">${resultado.message}</p>`;
                btnPedir.style.display = 'none';
                const detallesState = document.querySelector('.details');
                detallesState.textContent = "Solicitado";
                detallesState.style.color = "orange";
            } else {
                mensajeEstado.innerHTML = `<p class="mensaje-error">${resultado.message}</p>`;
                btnPedir.classList.remove('btn--disabled');
                btnPedir.textContent = 'Solicitar este libro';
            }
        });
    });
}

function irALibroAleatorio() {
    fetch('libros.json')
        .then(response => response.json())
        .then(data => {
            const libros = data.libros;
            const libroAleatorio = libros[Math.floor(Math.random() * libros.length)];
            window.location.href = `libro.html?id=${libroAleatorio.id}`;
        })
        .catch(error => {
            console.error('Error al cargar libro aleatorio:', error);
        });
}

document.addEventListener('DOMContentLoaded', () => {
    const usuario = JSON.parse(sessionStorage.getItem('usuarioActual'));
    const adminSection = document.getElementById('adminSection');
    const userSection = document.getElementById('userSection');
    const userTab = document.getElementById('userTab');

    if (usuario) {
        // Reemplazamos el vínculo de "Mi cuenta" por "Cerrar sesión"
        userSection.innerHTML = `<a href="#" id="logoutBtn" class="navbar__link">Cerrar sesión</a>`;
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('usuarioActual');
            window.location.href = 'index.html';
        });

        if (usuario.privilegios === 'admin') {
            adminSection.style.display = 'block'
            userTab.style.display = `none`; 
        } else {
            adminSection.style.display = 'none';  
            userTab.style.display = 'block';
        }
    } else {
        // Sin sesión, dejamos los vínculos por defecto o los ocultamos
        adminSection.style.display = 'none';
        userTab.style.display = 'none';
    }
});