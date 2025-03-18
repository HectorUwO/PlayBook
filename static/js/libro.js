document.addEventListener('DOMContentLoaded', async function() {
    if (await setupUserInterface() === 'invitado') { 
        document.querySelector('#btnPedir').style.backgroundColor = 'rgba(255, 0, 0, 0.493)';
        document.querySelector('#btnPedir').textContent = 'Inicia sesión para solicitar un prestamo';
        document.querySelector('#btnPedir').href = '/login';
        document.querySelector('#btnPedir').style.display = 'block';
    } else {document.querySelector('#btnPedir').style.display = 'block';}
    const libro = await loadBookDetails();

    const response = await fetch('/api/mis-solicitudes');
    let solicitudes = await response.json();
    solicitudes = solicitudes.filter(s => s.estado === 'pendiente');
    
    if (solicitudes[0].libro_id === libro.id) {
        document.querySelector('#Estado').textContent = 'SOLICITADO';
        document.querySelector('#Estado').classList.add('estado-solicitado');
    }
    if (solicitudes) {
        document.querySelector('#btnPedir').style.backgroundColor = 'rgba(255, 0, 0, 0.493)';
        document.querySelector('#btnPedir').textContent = 'Ya tienes una solicitud pendiente';
    }
});


async function loadBookDetails() {
    const bookId = window.location.pathname.split('/').pop();
    try {
        const response = await fetch(`/api/libros/${bookId}`);
        const libro = await response.json();
        // Cargar portada
        const coverUrl = await getBookCoverUrl(libro.isbn);
        document.querySelector('.images--img').src = coverUrl;
        document.querySelector('.images--img').alt = libro.titulo;

        // Actualizar detalles del libro
        document.querySelector('.title').textContent = `${libro.titulo} (${libro.anio})`;
        document.querySelector('.autor').textContent = libro.autor;
        document.querySelector('.descripcion').textContent = libro.descripcion;
        document.querySelector('.categoria').textContent = libro.categoria;
        document.querySelector('.estado').textContent = libro.estado.toUpperCase();
        document.querySelector('.estado').classList.add(`estado-${libro.estado.toLowerCase()}`);
        
        // Mostrar información de stock
        const stockDisplay = document.querySelector('#stockDisplay');
        if (libro.stock > 0) {
            stockDisplay.textContent = `Ejemplares disponibles: ${libro.stock}`;
            stockDisplay.classList.add('stock-disponible');
        } else {
            stockDisplay.textContent = 'No hay ejemplares disponibles';
            stockDisplay.classList.add('stock-agotado');
        }

        // Configurar botón de solicitud según el estado del libro y stock
        const btnPedir = document.querySelector('#btnPedir');
        if (libro.estado === 'disponible' && libro.stock > 0) {
            btnPedir.style.display = 'block';
            btnPedir.addEventListener('click', async (e) => {
                e.preventDefault();
                await solicitarLibro(libro.id);
            });
        } else {
            btnPedir.style.display = 'none';
            if (libro.estado === 'agotado') {
                document.querySelector('#mensajeEstado').textContent = 'Este libro no está disponible temporalmente';
            } else if (libro.estado === 'mantenimiento') {
                document.querySelector('#mensajeEstado').textContent = 'Este libro está en mantenimiento';
            }
        }

        // Cargar libros relacionados
        await loadRelatedBooks(libro.categoria, libro.id);
        return libro;

    } catch (error) {
        console.error('Error cargando detalles:', error);
    }
}

async function solicitarLibro(libroId) {
    try {
        const response = await fetch('/solicitar_libro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ libro_id: libroId })
        });

        const data = await response.json();

        if (response.ok) {
            // Actualizar la UI
            document.querySelector('#btnPedir').style.display = 'none';
            document.querySelector('.estado').textContent = 'SOLICITADO';
            document.querySelector('.estado').className = 'estado estado-details estado-solicitado';
            
            // Actualizar el display del stock
            const stockDisplay = document.querySelector('#stockDisplay');
            const currentStock = parseInt(stockDisplay.textContent.match(/\d+/)[0]) - 1;
            
            if (currentStock > 0) {
                stockDisplay.textContent = `Ejemplares disponibles: ${currentStock}`;
                stockDisplay.className = 'stock-disponible';
            } else {
                stockDisplay.textContent = 'No hay ejemplares disponibles';
                stockDisplay.className = 'stock-agotado';
            }
            
            // Mostrar toast de éxito
            showToast('¡Libro solicitado con éxito! Revisa el apartado Mi Cuenta para más detalles.', 'success');
        } else {
            // Mostrar toast de error
            showToast(data.error || 'Error al solicitar el libro', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al procesar la solicitud', 'error');
    }
}

async function loadRelatedBooks(categoria, currentBookId) {
    try {
        const response = await fetch(`/api/libros?categoria=${categoria}`);
        const libros = await response.json();
        
        const relacionados = libros
            .filter(libro => libro.id !== currentBookId)
            .slice(0, 5);

        const container = document.querySelector('.container');
        container.innerHTML = await Promise.all(relacionados.map(async (libro) => {
            const coverUrl = await getBookCoverUrl(libro.isbn);
            return `
                <a href="/libro/${libro.id}" class="nulo">
                    <div class="card">
                        <div class="card__image">
                            <img src="${coverUrl}" alt="${libro.titulo}" class="card--img">
                        </div>
                        <div class="card__title">${libro.titulo}</div>
                        <div class="card__autor">${libro.autor}</div>
                        <div class="card__anio">${libro.anio}</div>
                    </div>
                </a>
            `;
        })).then(cards => cards.join(''));
    } catch (error) {
        console.error('Error cargando libros relacionados:', error);
    }
}

