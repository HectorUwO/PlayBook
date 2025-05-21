document.addEventListener('DOMContentLoaded', async function() {
    await setupUserInterface();
    document.getElementById('userSection').style.display = 'none';
    await cargarSolicitudes();
    await cargarPrestamos();
    
    // Configurar los event listeners del modal
    document.getElementById('confirmCancel').addEventListener('click', procesarCancelacion);
    document.getElementById('cancelAction').addEventListener('click', cerrarModal);
    document.querySelector('.modal-close').addEventListener('click', cerrarModal);
    
    // Cerrar el modal si se hace clic fuera de él
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('confirmModal');
        if (event.target === modal) {
            cerrarModal();
        }
    });
});

// Variables para controlar la paginación de solicitudes
let currentSolicitudPage = 1;
const solicitudesPerPage = 5;
let allSolicitudes = [];

// Función para ajustar fechas (agregar un día)
function adjustDate(dateStr) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 1);
    return date;
}

async function cargarSolicitudes() {
    const container = document.getElementById('misSolicitudes');
    try {
        const response = await fetch('/api/mis-solicitudes');
        allSolicitudes = await response.json();

        if (allSolicitudes.length === 0) {
            container.innerHTML = '<p>No tienes solicitudes.</p>';
            return;
        }
        
        // Renderizar la página actual de solicitudes
        renderSolicitudes();
    } catch (error) {
        container.innerHTML = '<p>Error al cargar las solicitudes.</p>';
        console.error('Error:', error);
    }
}

function renderSolicitudes() {
    const container = document.getElementById('misSolicitudes');
    
    // Filter out approved solicitudes
    const filteredSolicitudes = allSolicitudes
        .filter(s => s.estado !== 'aprobada')
        // Sort by ID: highest ID (newest) first
        .sort((a, b) => b.id - a.id);
    
    if (filteredSolicitudes.length === 0) {
        container.innerHTML = '<p>No tienes solicitudes pendientes o denegadas.</p>';
        return;
    }
    
    const totalPages = Math.ceil(filteredSolicitudes.length / solicitudesPerPage);
    
    // Obtener las solicitudes para la página actual
    const startIndex = (currentSolicitudPage - 1) * solicitudesPerPage;
    const endIndex = Math.min(startIndex + solicitudesPerPage, filteredSolicitudes.length);
    const currentSolicitudes = filteredSolicitudes.slice(startIndex, endIndex);

    const html = `
        <table>
            <thead>
                <tr>
                    <th>Libro</th>
                    <th>Estado</th>
                    <th>Fecha de Solicitud</th>
                    ${currentSolicitudes.some(s => s.comentarios) ? '<th>Comentarios</th>' : ''}
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${currentSolicitudes.map(s => `
                    <tr>
                        <td>${s.titulo}</td>
                        <td><span class="estado-${s.estado.toLowerCase()}">${s.estado}</span></td>
                        <td>${adjustDate(s.fecha_solicitud).toLocaleDateString()}</td>
                        ${s.comentarios ? `<td>${s.comentarios}</td>` : 
                          currentSolicitudes.some(s => s.comentarios) ? '<td>-</td>' : ''}
                        <td>
                            ${s.estado === 'pendiente' ? `
                                <button class="btn btn-cancel" onclick="cancelarSolicitud(${s.id})">
                                    Cancelar
                                </button>
                            ` : ''}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ${filteredSolicitudes.length > solicitudesPerPage ? `
        <div class="pagination">
            <button class="pagination-btn" onclick="changeSolicitudPage(${Math.max(1, currentSolicitudPage - 1)})" ${currentSolicitudPage === 1 ? 'disabled' : ''}>Anterior</button>
            <span class="pagination-info">Página ${currentSolicitudPage} de ${totalPages}</span>
            <button class="pagination-btn" onclick="changeSolicitudPage(${Math.min(totalPages, currentSolicitudPage + 1)})" ${currentSolicitudPage === totalPages ? 'disabled' : ''}>Siguiente</button>
        </div>
        ` : ''}
    `;
    container.innerHTML = html;
}

function changeSolicitudPage(newPage) {
    currentSolicitudPage = newPage;
    renderSolicitudes();
}

let solicitudIdToCancel = null; // Variable global para almacenar el ID de la solicitud a cancelar

async function cancelarSolicitud(id) {
    // Guardar el ID de la solicitud a cancelar
    solicitudIdToCancel = id;
    
    // Mostrar el modal de confirmación
    const modal = document.getElementById('confirmModal');
    modal.style.display = 'flex';
}

// Función para procesar la cancelación después de la confirmación
async function procesarCancelacion() {
    if (!solicitudIdToCancel) return;
    
    try {
        const response = await fetch(`/api/solicitudes/${solicitudIdToCancel}/cancelar`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Solicitud cancelada exitosamente', 'success');
            // Recargar las solicitudes para actualizar la vista
            await cargarSolicitudes();
        } else {
            showToast(`Error: ${data.error}`, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al cancelar la solicitud', 'error');
    } finally {
        // Cerrar el modal y resetear el ID
        cerrarModal();
        solicitudIdToCancel = null;
    }
}

// Función para cerrar el modal
function cerrarModal() {
    const modal = document.getElementById('confirmModal');
    modal.style.display = 'none';
}

// Variables para controlar la paginación de préstamos
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
                            <td style="text-align: center">${adjustDate(p.fecha_prestamo).toLocaleDateString()}</td>
                            <td style="text-align: center">${adjustDate(p.fecha_devolucion_sugerida).toLocaleDateString()}</td>
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
    // Crear la fecha y añadir un día
    const date = new Date(año, mes - 1, dia);
    date.setDate(date.getDate() + 1);
    return date;
}