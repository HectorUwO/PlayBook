document.addEventListener('DOMContentLoaded', async function() {
    const user = await setupUserInterface(); // Cargar la interfaz de usuario
    const btnPedir = document.querySelector('#btnPedir'); // Botón de solicitud
    const bookId = window.location.pathname.split('/').pop(); // ID del libro actual
    const responseBook = await fetch(`/api/libros/${bookId}`); // Obtener información del libro
    const libro = await responseBook.json(); // Convertir la respuesta a JSON
    if (user === 'invitado') { 
        btnPedir.style.backgroundColor = 'rgba(255, 0, 0, 0.493)';
        btnPedir.textContent = 'Inicia sesión para solicitar un prestamo';
        btnPedir.href = '/login';
        btnPedir.style.display = 'block';
    } else {
        switch (libro.estado) {
            case 'disponible':
                btnPedir.addEventListener('click', async (e) => {
                    e.preventDefault();
                    await solicitarLibro(libro.id);
                });
                break;
            case 'agotado':
                const responseSolicitudes = await fetch('/api/mis-solicitudes');
                let solicitudes = await responseSolicitudes.json();
                solicitudes = solicitudes.filter(s => s.estado === 'pendiente');
                if (solicitudes[0] && solicitudes[0].libro_id === libro.id) {
                    btnPedir.style.backgroundColor = 'var(--warning-color)';
                    btnPedir.textContent = 'Tienes una solicitud pendiente';
                    btnPedir.style.display = 'block';
                    btnPedir.style.pointerEvents = 'none';
                } else {
                    document.querySelector('#mensajeEstado').textContent = 'Este libro no está disponible temporalmente. ¡Vuelve pronto!';
                    document.querySelector('#mensajeEstado').style = 'display: block;';
                }
                break;
            case 'mantenimiento':
                document.querySelector('#mensajeEstado').textContent = 'Este libro está en mantenimiento. ¡Vuelve pronto!';
                document.querySelector('#mensajeEstado').style = 'display: block;';
                document.querySelector('#mensajeEstado').style = ' background-color: yellow;';
                break;
        }
    }
    
    await loadBookDetails(libro);

    // Cargar solicitudes pendientes del usuario
    if (user !== 'invitado') {
        const responseSolicitudes = await fetch('/api/mis-solicitudes');
        let solicitudes = await responseSolicitudes.json();
        solicitudes = solicitudes.filter(s => s.estado === 'pendiente');

        if (solicitudes[0] && solicitudes[0].libro_id === libro.id) {
            document.querySelector('#Estado').textContent = 'SOLICITADO';
            document.querySelector('#Estado').classList.remove('estado-agotado');
            document.querySelector('#Estado').classList.add('estado-solicitado');
        }
        if (solicitudes.length > 0 && libro.estado === 'disponible') {
            btnPedir.style.backgroundColor = 'var(--warning-color)';
            btnPedir.textContent = 'Tienes una solicitud pendiente';
            btnPedir.style.display = 'block';
            btnPedir.style.pointerEvents = 'none';
        } else if (libro.estado === 'disponible') {
            btnPedir.style.display = 'block';
        }
    }
    document.querySelector('.estado').style.visibility = 'visible';
});

// Modificar loadBookDetails para que reciba el libro ya obtenido
async function loadBookDetails(libro) {
    try {
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
            document.querySelector(".stock-info").classList.add('stock-disponible');
        } else {
            stockDisplay.textContent = 'No hay ejemplares disponibles';
            document.querySelector(".stock-info").classList.add('stock-agotado');
        }

        // Cargar libros relacionados
        await loadRelatedBooks(libro.categoria, libro.id);
        document.querySelector('.product__details').style.visibility = 'visible';
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
                document.querySelector(".stock-info").className = 'stock-disponible';
            } else {
                stockDisplay.textContent = 'No hay ejemplares disponibles';
                document.querySelector(".stock-info").className = 'stock-agotado';
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
            .slice(0, 6);

        const container = document.querySelector('.container');
        container.innerHTML = await Promise.all(relacionados.map(async (libro) => {
            const coverUrl = await getBookCoverUrl(libro.isbn);
            return `
                <a href="/libro/${libro.id}" class="a-search">
                    <div class="card">
                        <div class="card__image">
                            <img src="${coverUrl}" alt="${libro.titulo}" class="card--img">
                        </div>
                        <div class="card__title">${libro.titulo}</div>
                        <div class="card__autor">${libro.autor}</div>
                        <div class="card__anio">${libro.anio}</div>
                        <div class="${getEstadoClass(libro.estado)}">${libro.estado.charAt(0).toUpperCase() + libro.estado.slice(1)}</div>
                    </div>
                </a>
            `;
        })).then(cards => cards.join(''));
    } catch (error) {
        console.error('Error cargando libros relacionados:', error);
    }
}

