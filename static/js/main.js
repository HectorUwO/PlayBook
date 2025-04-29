let allLibros = [];
// Add pagination state object to track current page for each category
let paginationState = {
    currentPage: 1,
    currentCategory: 'Literatura y novelas',
    booksPerPage: 12
};

//Funcion para cargar secciones segundo el rol del usuario
async function setupUserInterface() {
    const response = await fetch('/get_user_role');
    const data = await response.json();
    const userRole = data.rol;

    const adminSection = document.getElementById('adminSection');
    const userSection = document.getElementById('userSection');
    const loginSection = document.getElementById('loginSection');
    const closeSession = document.getElementById('closeSession');

    // Mostrar/ocultar secciones según el rol
    if (userRole === 'admin') {
        document.querySelector('.navbar__nav').style.gridColumn = '6/6';
        adminSection.style.display = 'block';
        userSection.style.display = 'block';
        loginSection.style.display = 'none';
        closeSession.style.display = 'block'; // Mostrar cerrar sesión
    } else if (userRole === 'usuario') {
        adminSection.style.display = 'none';
        userSection.style.display = 'block';
        loginSection.style.display = 'none';
        closeSession.style.display = 'block'; // Mostrar cerrar sesión
    } else {
        adminSection.style.display = 'none';
        userSection.style.display = 'none';
        loginSection.style.display = 'block';
        closeSession.style.display = 'none'; 
    }

    return userRole;
}

//Función para mostrar las secciones al cargar la página
if (window.location.pathname === "/") {
    document.addEventListener('DOMContentLoaded', async function() {
            await setupUserInterface();
        
        // Cargar todos los libros una sola vez
        try {
            const response = await fetch('/api/libros');
            allLibros = await response.json();
            // Mostrar categoría inicial
            mostrarLibrosPorCategoria('Literatura y novelas');
        } catch (error) {
            console.error('Error cargando libros:', error);
        }

        // Manejar clicks en tabs
        const tabs = document.querySelectorAll('.tabs__link, .tabs__link--isActive');
        tabs.forEach(tab => {
            tab.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Actualizar tabs activos
                tabs.forEach(t => t.className = 'tabs__link');
                this.className = 'tabs__link--isActive';

                // Filtrar y mostrar libros
                const categoria = this.dataset.categoria;
                // Reset to page 1 when changing categories
                paginationState.currentPage = 1;
                paginationState.currentCategory = categoria;
                mostrarLibrosPorCategoria(categoria);
            });
        });

        // Manejar búsqueda
        const searchInput = document.querySelector('.input--search');
        if (searchInput) {
            searchInput.addEventListener('input', e => {
                const searchTerm = e.target.value.toLowerCase();
                if (searchTerm === '') {
                    document.querySelector('.search__container').style.display = 'none';
                    return;
                }
                buscarLibros(searchTerm);
            });
        }
    });
}

//Función para verificar si la imagen existe
function checkImageExists(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            resolve(img.width > 1 && img.height > 1);
        };
        img.onerror = () => resolve(false);
        img.src = url;
    });
}

//Función para obtener la url de la portada del libro
async function getBookCoverUrl(isbn) {
    const openLibraryUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
    const exists = await checkImageExists(openLibraryUrl);
    return exists ? openLibraryUrl : '/static/covers/no-cover.png';
}

//Función para mostrar los libros por categoría
async function mostrarLibrosPorCategoria(categoria) {
    const container = document.querySelector('.container');
    const librosFiltrados = allLibros.filter(libro => libro.categoria === categoria);
    
    // Calculate pagination
    const { currentPage, booksPerPage } = paginationState;
    const totalPages = Math.ceil(librosFiltrados.length / booksPerPage);
    const startIndex = (currentPage - 1) * booksPerPage;
    const endIndex = startIndex + booksPerPage;
    const librosToShow = librosFiltrados.slice(startIndex, endIndex);
    
    container.innerHTML = librosToShow.map(libro => `
        <a href="/libro/${libro.id}" class="a-search">
            <div class="card">
                <div class="card__image">
                    <img src="/static/img/loading.gif" alt="${libro.titulo}" class="card--img" data-isbn="${libro.isbn}">
                </div>
                <div class="card__title">${libro.titulo}</div>
                <div class="card__autor">${libro.autor}</div>
                <div class="card__anio">${libro.anio}</div>
                <div class="${getEstadoClass(libro.estado)}">${libro.estado.charAt(0).toUpperCase() + libro.estado.slice(1)}</div>
            </div>
        </a>
    `).join('');
    
    // Add pagination controls after the books if needed
    if (totalPages > 1) {
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination';
        paginationContainer.style.gridColumn = '1 / -1'; // Make pagination span all columns
        
        let paginationHTML = '';
        
        // Add previous button
        paginationHTML += `
            <button class="pagination__btn ${currentPage === 1 ? 'pagination__btn--disabled' : ''}" 
                    ${currentPage === 1 ? 'disabled' : ''} 
                    data-page="prev">
                <span class="material-symbols-outlined">chevron_left</span>
            </button>
        `;
        
        // Add page numbers
        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <button class="pagination__btn ${i === currentPage ? 'pagination__btn--active' : ''}" 
                        data-page="${i}">
                    ${i}
                </button>
            `;
        }
        
        // Add next button
        paginationHTML += `
            <button class="pagination__btn ${currentPage === totalPages ? 'pagination__btn--disabled' : ''}" 
                    ${currentPage === totalPages ? 'disabled' : ''} 
                    data-page="next">
                <span class="material-symbols-outlined">chevron_right</span>
            </button>
        `;
        
        paginationContainer.innerHTML = paginationHTML;
        container.appendChild(paginationContainer);
        
        // Add event listeners to pagination buttons
        const paginationButtons = paginationContainer.querySelectorAll('.pagination__btn');
        paginationButtons.forEach(button => {
            button.addEventListener('click', function() {
                const page = this.dataset.page;
                
                if (page === 'prev' && currentPage > 1) {
                    paginationState.currentPage--;
                } else if (page === 'next' && currentPage < totalPages) {
                    paginationState.currentPage++;
                } else if (page !== 'prev' && page !== 'next') {
                    paginationState.currentPage = parseInt(page);
                }
                
                mostrarLibrosPorCategoria(categoria);
                // Scroll to top of container
                container.scrollIntoView({ behavior: 'smooth' });
            });
        });
    }

    // Cargar las imágenes después de crear los elementos
    const imgElements = container.querySelectorAll('.card--img');
    imgElements.forEach(async (img) => {
        const isbn = img.dataset.isbn;
        const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
        await loadImageWithFallback(img, coverUrl);
    });
}

//Función para buscar libros
async function buscarLibros(termino) {
    const contenedorBusqueda = document.querySelector('.search__container');
    const librosFiltrados = allLibros.filter(libro => 
        libro.titulo.toLowerCase().includes(termino) ||
        libro.autor.toLowerCase().includes(termino)
    );

    if (librosFiltrados.length === 0) {
        contenedorBusqueda.innerHTML = '<p>No se encontraron libros.</p>';
        return;
    }

    // Verificar las portadas para los resultados de búsqueda
    const librosConPortadas = await Promise.all(librosFiltrados.map(async (libro) => {
        const coverUrl = await getBookCoverUrl(libro.isbn);
        return {
            ...libro,
            coverUrl
        };
    }));

    contenedorBusqueda.style.display = 'block';
    contenedorBusqueda.innerHTML = librosConPortadas.map(libro => `
        <a href="/libro/${libro.id}" class="a-search">
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

    // Cargar las imágenes después de crear los elementos
    const imgElements = contenedorBusqueda.querySelectorAll('.search--img');
    imgElements.forEach(async (img) => {
        const isbn = img.dataset.isbn;
        const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
        await loadImageWithFallback(img, coverUrl);
    });
}

function getEstadoClass(estado) {
    switch(estado) {
        case 'disponible': return 'estado-disponible';
        case 'solicitado': return 'estado-solicitado';
        case 'agotado': return 'estado-agotado';
        case 'mantenimiento': return 'estado-mantenimiento';
        default: return '';
    }
}

async function loadImageWithFallback(imgElement, imageUrl, loadingUrl = '/static/covers/default-cover.png') {
    imgElement.src = loadingUrl;
    
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            imgElement.src = imageUrl;
            resolve(true);
        };
        img.onerror = () => {
            imgElement.src = '/static/covers/no-cover.png';
            resolve(false);
        };
        img.src = imageUrl;
    });
}

if (document.getElementById('sorprendemeBtn')){
    document.querySelector('#sorprendemeBtn').addEventListener('click', async function() {
        const randomIndex = Math.floor(Math.random() * allLibros.length);
        const libro = allLibros[randomIndex];
        window.location.href = `/libro/${libro.id}`;
    });
}

function showToast(message, type = 'success') {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    let icon = '';
    switch(type) {
        case 'success': icon = 'check_circle'; break;
        case 'error': icon = 'error'; break;
        case 'warning': icon = 'warning'; break;
        case 'info': icon = 'info'; break;
    }
    toast.innerHTML = `
        <span class="material-symbols-outlined toast__icon">${icon}</span>
        <span class="toast__message">${message}</span>
        <span class="material-symbols-outlined toast__close">close</span>
    `;

    // Agregar el nuevo toast al final para que se apile hacia arriba
    toastContainer.appendChild(toast);
    
    const closeBtn = toast.querySelector('.toast__close');
    closeBtn.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    });
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
            if (toastContainer.children.length === 0) {
                toastContainer.remove();
            }
        }, 300);
    }, 5000);
}

const btnSearchMobile = document.querySelector('#btn-search-mobile');
const searchMobileBox = document.querySelector('.search-mobile');
const btnCloseMobile = document.querySelector('#close-mobile');


btnSearchMobile.addEventListener('click', () => {
    searchMobileBox.style.display = 'block';
});
btnCloseMobile.addEventListener('click', () => {
    searchMobileBox.style.display = 'none';
});