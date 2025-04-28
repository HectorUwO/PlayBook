from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from flask_mysqldb import MySQL
import os
from groq import Groq

app = Flask(__name__)
# MySQL Configuration
app.config['MYSQL_HOST'] = os.getenv('DB_HOST', 'localhost')
app.config['MYSQL_USER'] = os.getenv('DB_USER', 'root')  
app.config['MYSQL_PASSWORD'] = os.getenv('DB_PASSWORD', '') 
app.config['MYSQL_DB'] = os.getenv('DB_NAME', 'playbook')  
# Session Configuration
app.secret_key = 'your_secret_key_here'

mysql = MySQL(app)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/user")
def user():
    return render_template("user.html")

@app.route("/admin")
def admin():
    if 'loggedin' not in session or session['rol'] != 'admin':
        return render_template("401.html"), 401
    return render_template("admin.html")

@app.route("/api/libros")
@app.route("/api/libros/<int:id>")
def get_libros(id=None):
    cursor = mysql.connection.cursor()
    
    if id is not None:
        # Obtener un libro específico
        cursor.execute('SELECT * FROM libros WHERE id = %s', (id,))
        libro = cursor.fetchone()
        if not libro:
            return render_template("404.html"), 404
        
        columns = [col[0] for col in cursor.description]
        libro_dict = dict(zip(columns, libro))
        cursor.close()
        return jsonify(libro_dict)
    else:
        # Obtener todos los libros
        categoria = request.args.get('categoria')
        if categoria:
            cursor.execute('SELECT * FROM libros WHERE categoria = %s', (categoria,))
        else:
            cursor.execute('SELECT * FROM libros')
            
        columns = [col[0] for col in cursor.description]
        libros = [dict(zip(columns, row)) for row in cursor.fetchall()]
        cursor.close()
        return jsonify(libros)

@app.route("/api/categorias")
def get_categorias():
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('SELECT DISTINCT categoria FROM libros')
        categorias = [row[0] for row in cursor.fetchall()]
        return jsonify(categorias)
    finally:
        cursor.close()

@app.route("/api/libros", methods=['POST'])
def crear_libro():
    if 'loggedin' not in session or session['rol'] != 'admin':
        return jsonify({'error': 'No autorizado'}), 401
    
    try:
        datos = request.get_json()
        if not datos:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        required_fields = ['titulo', 'autor', 'anio', 'isbn', 'categoria', 'descripcion', 'stock']
        for field in required_fields:
            if field not in datos:
                return jsonify({'error': f'Falta el campo {field}'}), 400
        
        cursor = mysql.connection.cursor()
        cursor.execute('''
            INSERT INTO libros (titulo, autor, anio, isbn, categoria, descripcion, stock)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        ''', (
            datos['titulo'],
            datos['autor'],
            datos['anio'],
            datos['isbn'],
            datos['categoria'],
            datos['descripcion'],
            datos['stock']
        ))
        
        mysql.connection.commit()
        id_nuevo_libro = cursor.lastrowid
        cursor.close()
        
        return jsonify({
            'mensaje': 'Libro creado exitosamente',
            'id': id_nuevo_libro
        }), 201
        
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/libros/<int:id>', methods=['PUT'])
def actualizar_libro(id):
    if 'loggedin' not in session or session['rol'] != 'admin':
        return jsonify({'error': 'No autorizado'}), 401
        
    try:
        data = request.get_json()
        cursor = mysql.connection.cursor()
        
        cursor.execute('''
            UPDATE libros 
            SET titulo = %s, autor = %s, anio = %s, isbn = %s, 
                categoria = %s, descripcion = %s, estado = %s, stock = %s
            WHERE id = %s
        ''', (
            data['titulo'], data['autor'], data['anio'], data['isbn'],
            data['categoria'], data['descripcion'], data['estado'], 
            data['stock'], id
        ))
        
        mysql.connection.commit()
        return jsonify({'message': 'Libro actualizado exitosamente'})
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()

@app.route('/api/libros/<int:id>', methods=['DELETE'])
def eliminar_libro(id):
    if 'loggedin' not in session or session['rol'] != 'admin':
        return jsonify({'error': 'No autorizado'}), 401
        
    try:
        cursor = mysql.connection.cursor()
        
        # Verificar si el libro está prestado
        cursor.execute('SELECT estado FROM libros WHERE id = %s', (id,))
        result = cursor.fetchone()
        if result and result[0] == 'prestado':
            return jsonify({'error': 'No se puede eliminar un libro prestado'}), 400
            
        cursor.execute('DELETE FROM libros WHERE id = %s', (id,))
        mysql.connection.commit()
        return jsonify({'message': 'Libro eliminado exitosamente'})
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()

@app.route("/libro/<int:id>")
def libro(id):
    cursor = mysql.connection.cursor()
    cursor.execute('SELECT * FROM libros WHERE id = %s', (id,))
    libro_tuple = cursor.fetchone()
    columns = [col[0] for col in cursor.description]
    if not libro_tuple:
        return render_template("404.html"), 404
    libro = dict(zip(columns, libro_tuple))
    return render_template("libro.html", libro=libro)

@app.route("/login", methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        nombre = request.form.get('nombre', '').strip()
        email = request.form.get('email', '').strip()
        
        if not nombre or not email:
            flash('Por favor complete todos los campos')
            return render_template("login.html"), 400
        
        cursor = mysql.connection.cursor()
        cursor.execute('SELECT id, email, nombre, rol FROM usuarios WHERE email = %s AND nombre = %s', (email, nombre))
        user = cursor.fetchone()
        cursor.close()
        
        if user:
            session['loggedin'] = True
            session['id'] = user[0]
            session['email'] = user[1]
            session['nombre'] = user[2]
            session['rol'] = user[3] 
            return redirect(url_for('index'))
        else:
            flash('Usuario o email incorrectos')
    
    return render_template("login.html")

@app.route('/get_user_role')
def get_user_role():
    if 'loggedin' in session:
        return {'rol': session.get('rol', 'usuario')}
    return {'rol': 'invitado'}

@app.route('/logout')
def logout():
    session.pop('loggedin', None)
    session.pop('id', None)
    session.pop('email', None)
    session.pop('nombre', None)
    session.pop('rol', None)
    return redirect(url_for('login'))

@app.route('/solicitar_libro', methods=['POST'])
def solicitar_libro():
    if 'loggedin' not in session:
        return render_template("401.html"), 401
    
    data = request.get_json()
    if not data or 'libro_id' not in data:
        return jsonify({'error': 'Datos de solicitud incompletos'}), 400
        
    libro_id = data.get('libro_id')
    usuario_id = session['id']
    
    cursor = mysql.connection.cursor()
    try:
        # Verificar si el usuario tiene préstamos activos
        cursor.execute("""
            SELECT COUNT(*) 
            FROM prestamos 
            WHERE usuario_id = %s AND estado = 'activo'
        """, (usuario_id,))
        (prestamos_activos,) = cursor.fetchone()
        if prestamos_activos > 0:
            return jsonify({'error': 'Ya tienes un préstamo activo. Devuelve el libro antes de solicitar otro'}), 400

        # Verificar si el usuario ya tiene una solicitud pendiente
        cursor.execute("""
            SELECT COUNT(*) 
            FROM solicitudes 
            WHERE usuario_id = %s AND estado = 'pendiente'
        """, (usuario_id,))
        (solicitudes_pendientes,) = cursor.fetchone()
        if solicitudes_pendientes > 0:
            return jsonify({'error': 'Ya tienes una solicitud pendiente'}), 400
        
        # Verificar disponibilidad y stock del libro
        cursor.execute('SELECT estado, stock FROM libros WHERE id = %s', (libro_id,))
        result = cursor.fetchone()
        if not result:
            return jsonify({'error': 'Libro no encontrado'}), 404
            
        estado, stock = result
        if estado != 'disponible':
            return jsonify({'error': 'El libro no está disponible'}), 400
            
        if stock <= 0:
            return jsonify({'error': 'No hay ejemplares disponibles'}), 400
        
        # Crear la solicitud y reducir el stock, actualizando el estado si el nuevo stock es <= 0
        cursor.execute('''
            INSERT INTO solicitudes (usuario_id, libro_id, fecha_solicitud, estado) 
            VALUES (%s, %s, CURRENT_TIMESTAMP, 'pendiente')
        ''', (usuario_id, libro_id))
        
        cursor.execute('''
            UPDATE libros 
            SET stock = stock - 1,
                estado = CASE WHEN (stock - 1) <= 0 THEN 'agotado' ELSE 'disponible' END
            WHERE id = %s
        ''', (libro_id,))
        
        mysql.connection.commit()
        return jsonify({'message': 'Solicitud realizada con éxito'})
        
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()

@app.route('/api/mis-solicitudes')
def mis_solicitudes():
    if 'loggedin' not in session:
        return render_template("401.html"), 401
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('''
            SELECT s.id, l.titulo, s.estado, s.fecha_solicitud, s.libro_id
            FROM solicitudes s 
            JOIN libros l ON s.libro_id = l.id 
            WHERE s.usuario_id = %s
            ORDER BY s.fecha_solicitud DESC
        ''', (session['id'],))
        
        columns = ['id', 'titulo', 'estado', 'fecha_solicitud', 'libro_id']
        solicitudes = [dict(zip(columns, row)) for row in cursor.fetchall()]
        return jsonify(solicitudes)
    finally:
        cursor.close()

@app.route('/api/mis-prestamos')
def mis_prestamos():
    if 'loggedin' not in session:
        return render_template("401.html"), 401
    
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('''
            SELECT p.id, l.titulo, p.fecha_prestamo, p.fecha_devolucion_sugerida, p.estado
            FROM prestamos p 
            JOIN libros l ON p.libro_id = l.id 
            WHERE p.usuario_id = %s 
            ORDER BY p.fecha_prestamo DESC
        ''', (session['id'],))
        
        columns = ['id', 'titulo', 'fecha_prestamo', 'fecha_devolucion_sugerida', 'estado']
        prestamos = [dict(zip(columns, row)) for row in cursor.fetchall()]
        return jsonify(prestamos)
    finally:
        cursor.close()

@app.route('/api/libros/buscar')
def buscar_libros():
    query = request.args.get('q', '')
    if len(query) < 2:
        return jsonify([])
        
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('''
            SELECT id, titulo, autor, estado, isbn
            FROM libros 
            WHERE titulo LIKE %s OR autor LIKE %s
        ''', (f'%{query}%', f'%{query}%'))
        
        columns = ['id', 'titulo', 'autor', 'estado', 'isbn']
        libros = [dict(zip(columns, row)) for row in cursor.fetchall()]
        return jsonify(libros)
    finally:
        cursor.close()
        

@app.route('/api/usuarios/buscar')
def buscar_usuarios():
    if 'loggedin' not in session or session['rol'] != 'admin':
        return jsonify({'error': 'No autorizado'}), 401
        
    query = request.args.get('q', '')
    if len(query) < 2:
        return jsonify([])
        
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('''
            SELECT id, nombre, email 
            FROM usuarios 
            WHERE nombre LIKE %s OR email LIKE %s
        ''', (f'%{query}%', f'%{query}%'))
        
        columns = ['id', 'nombre', 'email']
        usuarios = [dict(zip(columns, row)) for row in cursor.fetchall()]
        return jsonify(usuarios)
    finally:
        cursor.close()

@app.route('/api/prestamos', methods=['POST'])
def crear_prestamo():
    if 'loggedin' not in session or session['rol'] != 'admin':
        return jsonify({'error': 'No autorizado'}), 401
        
    data = request.get_json()
    if not data or 'idLibro' not in data or 'idUsuario' not in data:
        return jsonify({'error': 'Datos incompletos'}), 400
        
    cursor = mysql.connection.cursor()
    try:
        # Verificar disponibilidad del libro y stock
        cursor.execute('SELECT estado, stock FROM libros WHERE id = %s', (data['idLibro'],))
        result = cursor.fetchone()
        if not result:
            return jsonify({'error': 'Libro no encontrado'}), 404
            
        estado, stock = result
        if estado != 'disponible':
            return jsonify({'error': 'Libro no disponible'}), 400
            
        if stock <= 0:
            return jsonify({'error': 'No hay ejemplares disponibles'}), 400
            
        # Crear el préstamo y actualizar stock
        cursor.execute('''
            INSERT INTO prestamos (libro_id, usuario_id, fecha_prestamo, estado)
            VALUES (%s, %s, CURRENT_TIMESTAMP, 'activo')
        ''', (data['idLibro'], data['idUsuario']))
        
        # Actualizar stock y estado usando condición <=0
        cursor.execute('''
            UPDATE libros 
            SET stock = stock - 1,
                estado = CASE WHEN (stock - 1) <= 0 THEN 'agotado' ELSE 'disponible' END
            WHERE id = %s
        ''', (data['idLibro'],))
        
        mysql.connection.commit()
        return jsonify({'message': 'Préstamo creado exitosamente'})
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()

@app.route('/api/solicitudes/<int:id>', methods=['PUT'])
def gestionar_solicitud(id):
    if 'loggedin' not in session or session['rol'] != 'admin':
        return jsonify({'error': 'No autorizado'}), 401
        
    data = request.get_json()
    if not data or 'estado' not in data:
        return jsonify({'error': 'Estado no especificado'}), 400
        
    cursor = mysql.connection.cursor()
    try:
        # Obtener información de la solicitud y el libro
        cursor.execute('''
            SELECT s.libro_id, s.estado as estado_solicitud, l.stock, l.estado
            FROM solicitudes s
            JOIN libros l ON s.libro_id = l.id
            WHERE s.id = %s
        ''', (id,))
        result = cursor.fetchone()
        if not result:
            return jsonify({'error': 'Solicitud no encontrada'}), 404
            
        libro_id, estado_solicitud, stock, estado_libro = result
        
        if estado_solicitud != 'pendiente':
            return jsonify({'error': 'Esta solicitud ya fue procesada'}), 400

        # Actualizar estado de la solicitud
        cursor.execute('UPDATE solicitudes SET estado = %s WHERE id = %s', 
                      (data['estado'], id))

        if data['estado'] == 'aprobada':
            # Crear el préstamo (el stock ya fue reducido en la solicitud)
            cursor.execute('''
                INSERT INTO prestamos (libro_id, usuario_id, fecha_prestamo, estado)
                SELECT libro_id, usuario_id, CURRENT_TIMESTAMP, 'activo'
                FROM solicitudes WHERE id = %s
            ''', (id,))

        elif data['estado'] == 'denegada':
            # Aumentar el stock y actualizar estado: si (stock + 1) <= 0, 'agotado'; sino 'disponible'
            cursor.execute('''
                UPDATE libros 
                SET stock = stock + 1,
                    estado = CASE WHEN (stock + 1) <= 0 THEN 'agotado' ELSE 'disponible' END
                WHERE id = %s
            ''', (libro_id,))

        mysql.connection.commit()
        return jsonify({'message': 'Solicitud procesada correctamente'})
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()

@app.route('/api/prestamos/<int:id>/devolver', methods=['PUT'])
def devolver_libro(id):
    if 'loggedin' not in session or session['rol'] != 'admin':
        return jsonify({'error': 'No autorizado'}), 401
        
    cursor = mysql.connection.cursor()
    try:
        # Obtener información del préstamo y libro
        cursor.execute('''
            SELECT l.id, l.estado, p.estado as estado_prestamo
            FROM prestamos p
            JOIN libros l ON p.libro_id = l.id
            WHERE p.id = %s
        ''', (id,))
        
        resultado = cursor.fetchone()
        if not resultado:
            return jsonify({'error': 'Préstamo no encontrado'}), 404
            
        libro_id, estado_libro, estado_prestamo = resultado
        
        # Validaciones
        if estado_prestamo != 'activo':
            return jsonify({'error': 'Este préstamo ya no está activo'}), 400
        
        if estado_libro == 'mantenimiento':
            return jsonify({'error': 'No se puede devolver un libro en mantenimiento'}), 400
        
        # Actualizar el préstamo y aumentar el stock del libro
        cursor.execute('''
            UPDATE prestamos p
            JOIN libros l ON p.libro_id = l.id
            SET p.estado = 'devuelto',
                p.fecha_devolucion = CURRENT_TIMESTAMP,
                l.stock = l.stock + 1,
                l.estado = CASE WHEN (l.stock + 1) <= 0 THEN 'agotado' ELSE 'disponible' END
            WHERE p.id = %s
        ''', (id,))
            
        mysql.connection.commit()
        return jsonify({'message': 'Libro devuelto exitosamente'})
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()

@app.route('/api/solicitudes/pendientes')
def get_solicitudes_pendientes():
    if 'loggedin' not in session or session['rol'] != 'admin':
        return jsonify({'error': 'No autorizado'}), 401
        
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('''
            SELECT s.id, u.nombre as nombre_usuario, l.titulo as titulo_libro,
                   s.fecha_solicitud, s.estado
            FROM solicitudes s
            JOIN usuarios u ON s.usuario_id = u.id
            JOIN libros l ON s.libro_id = l.id
            WHERE s.estado = 'pendiente'
            ORDER BY s.fecha_solicitud DESC
        ''')
        
        columns = ['id', 'nombre_usuario', 'titulo_libro', 'fecha_solicitud', 'estado']
        solicitudes = [dict(zip(columns, row)) for row in cursor.fetchall()]
        return jsonify(solicitudes)
    finally:
        cursor.close()

@app.route('/api/prestamos/activos')
def get_prestamos_activos():
    if 'loggedin' not in session or session['rol'] != 'admin':
        return jsonify({'error': 'No autorizado'}), 401
        
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('''
            SELECT p.id, l.titulo, u.nombre as nombre_usuario, 
                   p.fecha_prestamo, l.id as libro_id, u.id as usuario_id
            FROM prestamos p
            JOIN libros l ON p.libro_id = l.id
            JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.estado = 'activo'
            ORDER BY p.fecha_prestamo DESC
        ''')
        
        columns = ['id', 'titulo', 'nombre_usuario', 'fecha_prestamo', 'libro_id', 'usuario_id']
        prestamos = [dict(zip(columns, row)) for row in cursor.fetchall()]
        return jsonify(prestamos)
    finally:
        cursor.close()

@app.route('/api/prestamos/buscar')
def buscar_prestamos():
    if 'loggedin' not in session or session['rol'] != 'admin':
        return jsonify({'error': 'No autorizado'}), 401
        
    query = request.args.get('q', '')
    if len(query) < 2:
        return jsonify([])
        
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('''
            SELECT p.id, l.titulo, u.nombre as nombre_usuario, 
                   p.fecha_prestamo, u.id as usuario_id, l.isbn, l.id as libro_id
            FROM prestamos p
            JOIN libros l ON p.libro_id = l.id
            JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.estado = 'activo'
            AND (l.titulo LIKE %s OR u.nombre LIKE %s)
        ''', (f'%{query}%', f'%{query}%'))
        
        columns = ['id', 'titulo', 'nombre_usuario', 'fecha_prestamo', 'usuario_id', 'isbn', 'libro_id']
        prestamos = [dict(zip(columns, row)) for row in cursor.fetchall()]
        return jsonify(prestamos)
    finally:
        cursor.close()

@app.route('/api/prestamos/buscar-activo', methods=['POST'])
def buscar_prestamo_activo():
    if 'loggedin' not in session or session['rol'] != 'admin':
        return jsonify({'error': 'No autorizado'}), 401
        
    data = request.get_json()
    if not data or 'libro_id' not in data or 'usuario_id' not in data:
        return jsonify({'error': 'Datos incompletos'}), 400
        
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('''
            SELECT id
            FROM prestamos
            WHERE libro_id = %s 
            AND usuario_id = %s 
            AND estado = 'activo'
        ''', (data['libro_id'], data['usuario_id']))
        
        resultado = cursor.fetchone()
        if resultado:
            return jsonify({'prestamo_id': resultado[0]})
        else:
            return jsonify({'error': 'No se encontró un préstamo activo'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()

@app.route('/api/estadisticas')
def get_estadisticas():
    if 'loggedin' not in session or session['rol'] != 'admin':
        return jsonify({'error': 'No autorizado'}), 401
        
    cursor = mysql.connection.cursor()
    try:
        stats = {
            'libros': {},
            'actividad': {},
            'usuarios': {}
        }
        
        # Estadísticas de libros y stock
        cursor.execute('''
            SELECT 
                COUNT(*) as total_libros,
                SUM(stock) as total_ejemplares,
                SUM(CASE WHEN estado = "disponible" THEN stock ELSE 0 END) as ejemplares_disponibles,
                SUM(CASE WHEN estado = "agotado" THEN 1 ELSE 0 END) as libros_agotados,
                COUNT(CASE WHEN stock > 0 THEN 1 END) as libros_con_stock
            FROM libros
        ''')
        result = cursor.fetchone()
        stats['libros'] = {
            'total_titulos': result[0],
            'total_ejemplares': result[1] or 0,
            'ejemplares_disponibles': result[2] or 0,
            'libros_agotados': result[3] or 0,
            'libros_con_stock': result[4] or 0
        }
        
        # Estadísticas de actividad (consultas separadas)
        cursor.execute('SELECT COUNT(*) FROM solicitudes WHERE estado = "pendiente"')
        pendientes = cursor.fetchone()[0] or 0
        
        cursor.execute('SELECT COUNT(*) FROM prestamos WHERE estado = "activo"')
        activos = cursor.fetchone()[0] or 0
        
        stats['actividad'] = {
            'solicitudes_pendientes': pendientes,
            'prestamos_activos': activos
        }
        
        # Estadísticas de usuarios
        cursor.execute('''
            SELECT 
                COUNT(*) as total_usuarios
            FROM usuarios
        ''')
        total_usuarios = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(DISTINCT usuario_id) FROM prestamos WHERE estado = "activo"')
        usuarios_con_prestamos = cursor.fetchone()[0] or 0
        
        stats['usuarios'] = {
            'total': total_usuarios,
            'con_prestamos': usuarios_con_prestamos
        }
        
        return jsonify(stats)
    finally:
        cursor.close()

@app.route('/api/usuarios', methods=['POST'])
def crear_usuario():
    if 'loggedin' not in session or session['rol'] != 'admin':
        return jsonify({'error': 'No autorizado'}), 401
        
    data = request.get_json()
    if not data or not all(k in data for k in ('nombre', 'email', 'privilegios')):
        return jsonify({'error': 'Datos incompletos'}), 400
        
    cursor = mysql.connection.cursor()
    try:
        # Verificar si el email ya existe
        cursor.execute('SELECT id FROM usuarios WHERE email = %s', (data['email'],))
        if cursor.fetchone():
            return jsonify({'error': 'El email ya está registrado'}), 400
            
        # Crear el usuario
        cursor.execute('''
            INSERT INTO usuarios (nombre, email, rol)
            VALUES (%s, %s, %s)
        ''', (data['nombre'], data['email'], data['privilegios']))
        
        mysql.connection.commit()
        return jsonify({'message': 'Usuario creado exitosamente'}), 201
        
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()

@app.route('/api/libros/buscar-isbn')
def buscar_libro_por_isbn():
    isbn = request.args.get('isbn', '')
    if not isbn:
        return jsonify({'error': 'ISBN no proporcionado'}), 400
        
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('SELECT * FROM libros WHERE isbn = %s', (isbn,))
        libro = cursor.fetchone()
        
        if libro:
            # Si encuentra el libro, devuelve sus detalles
            columns = [col[0] for col in cursor.description]
            libro_dict = dict(zip(columns, libro))
            return jsonify({
                'encontrado': True,
                'libro': libro_dict
            })
        else:
            # Si no encuentra el libro, indica que no existe
            return jsonify({
                'encontrado': False
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()


@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(401)
def unauthorized(e):
    return render_template('401.html'), 401

@app.route('/api/ai/generate-description', methods=['POST'])
def generate_description():
    if 'loggedin' not in session or session['rol'] != 'admin':
        return jsonify({'error': 'No autorizado'}), 401
        
    try:
        # Get the payload from the request
        data = request.get_json()
        if not data or 'messages' not in data:
            return jsonify({'error': 'Datos insuficientes'}), 400
            
        # Initialize Groq client
        groq_api_key = os.environ.get("GROQ_API_KEY")
        
        # Check if API key is available
        if not groq_api_key:
            # For development, you can set a default key here
            # groq_api_key = "your-api-key-here"  # Uncomment and set your key for testing
            
            # Log the error for server-side diagnostics
            app.logger.error("GROQ_API_KEY environment variable is not set")
            return jsonify({
                'error': 'API key no configurada', 
                'message': 'El administrador debe configurar la clave API de Groq en el servidor'
            }), 500
            
        client = Groq(api_key=groq_api_key)
        
        # Request text generation from Groq
        try:
            chat_completion = client.chat.completions.create(
                messages=data['messages'],
                model=data.get('model', "llama-3.3-70b-versatile"),
            )
            
            # Extract just the response content to simplify the response
            response_data = {
                'choices': [
                    {
                        'message': {
                            'content': chat_completion.choices[0].message.content
                        }
                    }
                ]
            }
            
            return jsonify(response_data)
            
        except Exception as e:
            app.logger.error(f"Groq API error: {str(e)}")
            return jsonify({'error': 'Error en servicio de IA', 'message': str(e)}), 500
        
    except Exception as e:
        app.logger.error(f"General error in generate_description: {str(e)}")
        return jsonify({'error': 'Error del servidor', 'message': str(e)}), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
