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

async function cargarPrestamos() {
    const container = document.getElementById('misLibros');
    try {
        const response = await fetch('/api/mis-prestamos');
        const prestamos = await response.json();

        if (prestamos.length === 0) {
            container.innerHTML = '<p>No tienes libros prestados actualmente.</p>';
            return;
        }

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
                    ${prestamos.map(p => {
                        const fechainicial = new Date(p.fecha_prestamo).toLocaleDateString();
                        const fechafinal = new Date(p.fecha_devolucion_sugerida).toLocaleDateString();
                        
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
        `;
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = '<p>Error al cargar los préstamos.</p>';
        console.error('Error:', error);
    }
}