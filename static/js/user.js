document.addEventListener('DOMContentLoaded', async function() {
    await setupUserInterface();
    document.getElementById('userSection').style.display = 'none';
    await cargarSolicitudes();
    await cargarPrestamos();
});

async function cargarSolicitudes() {
    const container = document.getElementById('misSolicitudes');
    try {
        const response = await fetch('/api/mis-solicitudes');
        let solicitudes = await response.json();
        solicitudes = solicitudes.filter(s => s.estado === 'pendiente');

        if (solicitudes.length === 0) {
            container.innerHTML = '<p>No tienes solicitudes pendientes.</p>';
            return;
        }
        const html = `
            <table>
                <thead>
                    <tr>
                        <th>Libro</th>
                        <th>Estado</th>
                        <th>Fecha de Solicitud</th>
                    </tr>
                </thead>
                <tbody>
                    ${solicitudes.map(s => `
                        <tr>
                            <td>${s.titulo}</td>
                            <td><span class="estado-${s.estado.toLowerCase()}">${s.estado}</span></td>
                            <td>${new Date(s.fecha_solicitud).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = '<p>Error al cargar las solicitudes.</p>';
        console.error('Error:', error);
    }
}

// Variables para controlar la paginación
let currentPage = 1;
const itemsPerPage = 5;
let allPrestamos = [];

async function cargarPrestamos() {
    const container = document.getElementById('misLibros');
    try {
        const response = await fetch('/api/mis-prestamos');
        allPrestamos = await response.json();

        if (allPrestamos.length === 0) {
            container.innerHTML = '<p>No tienes libros prestados actualmente.</p>';
            return;
        }

        // Renderizar la página actual
        renderPrestamosPage();
    } catch (error) {
        container.innerHTML = '<p>Error al cargar los préstamos.</p>';
        console.error('Error:', error);
    }
}

function renderPrestamosPage() {
    const container = document.getElementById('misLibros');
    const totalPages = Math.ceil(allPrestamos.length / itemsPerPage);
    
    // Obtener los préstamos para la página actual
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, allPrestamos.length);
    const currentPrestamos = allPrestamos.slice(startIndex, endIndex);

    const html = `
        <table>
            <thead>
                <tr>
                    <th style="text-align: center">Libro</th>
                    <th style="text-align: center">Fecha de Préstamo</th>
                    <th style="text-align: center">Fecha de Devolución Sugerida</th>
                    <th style="text-align: center">Estado</th>
                </tr>
            </thead>
            <tbody>
                ${currentPrestamos.map(p => {
                    const fechainicial = convertirFecha(p.fecha_prestamo);
                    const fechafinal = convertirFecha(p.fecha_devolucion_sugerida);
                    
                    // Verificar estado de entrega retrasada
                    if (fechainicial >= fechafinal) {
                        p.estado = 'entrega-retrasada';
                        console.log('entrega retrasada');
                        showToast(`Entrega retrasada, el libro ${p.titulo.toLowerCase()} se encuentra en estado de entrega retrasada, entregalo lo mas pronto posible.`, 'warning');
                    }
                    
                    // Verificar préstamo activo (independiente del estado de retraso)
                    if (p.estado === 'activo') {
                        console.log('prestamo activo');
                        showToast(`Cuentas con un prestamo activo!, Recoge el libro ${p.titulo} en la libreria, si ya lo recogiste ignora este mensaje.`, 'success');
                    }
                    
                    return `
                        <tr>
                            <td style="text-align: center">${p.titulo}</td>
                            <td style="text-align: center">${new Date(p.fecha_prestamo).toLocaleDateString()}</td>
                            <td style="text-align: center">${new Date(p.fecha_devolucion_sugerida).toLocaleDateString()}</td>
                            <td style="text-align: center"><span class="estado-${p.estado}">${p.estado.toUpperCase()}</span></td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
        ${allPrestamos.length > itemsPerPage ? `
        <div class="pagination">
            <button class="pagination-btn" onclick="changePage(${Math.max(1, currentPage - 1)})" ${currentPage === 1 ? 'disabled' : ''}>Anterior</button>
            <span class="pagination-info">Página ${currentPage} de ${totalPages}</span>
            <button class="pagination-btn" onclick="changePage(${Math.min(totalPages, currentPage + 1)})" ${currentPage === totalPages ? 'disabled' : ''}>Siguiente</button>
        </div>
        ` : ''}
    `;
    container.innerHTML = html;
}

function changePage(newPage) {
    currentPage = newPage;
    renderPrestamosPage();
}

function convertirFecha(fechaStr) {
    const [dia, mes, año] = fechaStr.split('/').map(Number);
    return new Date(año, mes - 1, dia); 
}