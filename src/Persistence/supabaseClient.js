// ============================================================
// U-Ride UTA - supabaseClient.js
// Capa de Persistencia: conexion a Supabase
// Proyecto: qwszgjivoknjhhswiatz
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL  = 'https://qwszgjivoknjhhswiatz.supabase.co';
// IMPORTANTE: Reemplaza esta key con la anon public key real de tu proyecto Supabase.
// La encuentras en: Supabase Dashboard → Settings → API → Project API keys → anon public
const SUPABASE_ANON_KEY = 'REEMPLAZA_CON_TU_ANON_KEY';

// La anon public key puede vivir en frontend si las politicas RLS estan bien configuradas.
// Nunca pongas aqui la service_role key.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Utilidades ──────────────────────────────────────────────

function crearPasswordHash(password) {
    return btoa(`${password}_uta_salt`);
}

function generarCodigo6() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── Sesion local ────────────────────────────────────────────

export function obtenerUsuarioActual() {
    const raw = localStorage.getItem('uride_usuario');
    return raw ? JSON.parse(raw) : null;
}

export function cerrarSesion() {
    localStorage.removeItem('uride_usuario');
    window.location.href = 'index.html';
}

function guardarSesion(usuario) {
    localStorage.setItem('uride_usuario', JSON.stringify(usuario));
}

// ── RF1: Registro con correo institucional ───────────────────

export async function registrarUsuario({ nombre, email, password, rol, telefono, carrera, zona, matricula }) {
    const emailNorm = email.trim().toLowerCase();

    if (!emailNorm.endsWith('@uta.edu.ec')) {
        throw new Error('Debes usar tu correo institucional (@uta.edu.ec).');
    }

    // Verificar si ya existe
    const { data: existe } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', emailNorm)
        .maybeSingle();

    if (existe) throw new Error('Ese correo ya esta registrado.');

    const codigo = generarCodigo6();

    const { data, error } = await supabase
        .from('usuarios')
        .insert([{
            nombre:             nombre.trim(),
            email:              emailNorm,
            password_hash:      crearPasswordHash(password),
            rol:                rol || 'pasajero',
            telefono:           telefono || null,
            carrera:            carrera || null,
            zona_referencia:    zona || null,
            matricula:          matricula || null,
            verificado:         false,
            estado:             'pendiente_verificacion',
            codigo_verificacion: codigo
        }])
        .select()
        .single();

    if (error) throw new Error('Error al registrar: ' + error.message);

    // Registrar evento
    await registrarEvento(data.id, 'registro', 'Nuevo usuario registrado');

    // En produccion aqui se enviaria el codigo por email.
    // Para demo lo guardamos en sessionStorage para que la pagina de verificacion lo lea.
    sessionStorage.setItem('uride_codigo_demo', codigo);
    sessionStorage.setItem('uride_email_verificar', emailNorm);

    return data;
}

// ── RF1: Verificacion de codigo ──────────────────────────────

export async function verificarCodigo(email, codigoIngresado) {
    const emailNorm = email.trim().toLowerCase();

    const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', emailNorm)
        .maybeSingle();

    if (error || !usuario) throw new Error('Usuario no encontrado.');

    if (usuario.codigo_verificacion !== codigoIngresado.trim()) {
        throw new Error('Codigo incorrecto. Revisa tu correo.');
    }

    const { data: actualizado, error: errUpd } = await supabase
        .from('usuarios')
        .update({ verificado: true, estado: 'activo', codigo_verificacion: null })
        .eq('id', usuario.id)
        .select()
        .single();

    if (errUpd) throw new Error('Error al verificar: ' + errUpd.message);

    guardarSesion(actualizado);
    await registrarEvento(actualizado.id, 'verificacion', 'Correo verificado');
    return actualizado;
}

// ── RF1: Inicio de sesion ────────────────────────────────────

export async function iniciarSesion(email, password) {
    const emailNorm = email.trim().toLowerCase();

    const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', emailNorm)
        .eq('password_hash', crearPasswordHash(password))
        .maybeSingle();

    if (error || !data) throw new Error('Correo o contrasena incorrectos.');

    if (data.estado === 'suspendido') {
        throw new Error('Tu cuenta esta suspendida. Contacta al administrador.');
    }

    if (data.estado === 'pendiente_verificacion') {
        sessionStorage.setItem('uride_email_verificar', emailNorm);
        throw new Error('PENDIENTE_VERIFICACION');
    }

    guardarSesion(data);
    await registrarEvento(data.id, 'login', 'Inicio de sesion');
    return data;
}

// ── Recuperacion de contrasena ───────────────────────────────

export async function solicitarRecuperacion(email) {
    const emailNorm = email.trim().toLowerCase();

    if (!emailNorm.endsWith('@uta.edu.ec')) {
        throw new Error('Ingresa tu correo institucional (@uta.edu.ec).');
    }

    const { data: usuario } = await supabase
        .from('usuarios')
        .select('id, nombre')
        .eq('email', emailNorm)
        .maybeSingle();

    if (!usuario) throw new Error('No existe una cuenta con ese correo.');

    const codigo = generarCodigo6();

    await supabase
        .from('usuarios')
        .update({ codigo_verificacion: codigo })
        .eq('id', usuario.id);

    // Demo: guardar en sessionStorage
    sessionStorage.setItem('uride_codigo_demo', codigo);
    sessionStorage.setItem('uride_email_recuperar', emailNorm);

    return { mensaje: 'Codigo enviado a tu correo institucional.' };
}

export async function restablecerContrasena(email, codigo, nuevaPassword) {
    const emailNorm = email.trim().toLowerCase();

    const { data: usuario } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', emailNorm)
        .maybeSingle();

    if (!usuario) throw new Error('Usuario no encontrado.');
    if (usuario.codigo_verificacion !== codigo.trim()) throw new Error('Codigo incorrecto.');

    const { data: actualizado, error } = await supabase
        .from('usuarios')
        .update({ password_hash: crearPasswordHash(nuevaPassword), codigo_verificacion: null })
        .eq('id', usuario.id)
        .select()
        .single();

    if (error) throw new Error('Error al restablecer: ' + error.message);

    await registrarEvento(actualizado.id, 'recuperacion_contrasena', 'Contrasena restablecida');
    return actualizado;
}

// ── RF2: Edicion de perfil ───────────────────────────────────

export async function editarPerfil(usuarioId, { nombre, telefono, carrera, zona, foto_url }) {
    const { data, error } = await supabase
        .from('usuarios')
        .update({
            nombre:          nombre?.trim() || undefined,
            telefono:        telefono || null,
            carrera:         carrera || null,
            zona_referencia: zona || null,
            foto_url:        foto_url || null,
            updated_at:      new Date().toISOString()
        })
        .eq('id', usuarioId)
        .select()
        .single();

    if (error) throw new Error('Error al actualizar perfil: ' + error.message);

    guardarSesion(data);
    await registrarEvento(usuarioId, 'edicion_perfil', 'Perfil actualizado');
    return data;
}

// ── RF3: Publicar viaje ──────────────────────────────────────

export async function publicarViaje({ conductorId, origen, destino, fecha, hora, cupos, precio, ruta, notas }) {
    const { data, error } = await supabase
        .from('viajes')
        .insert([{
            conductor_id:      conductorId,
            origen:            origen.trim(),
            destino:           destino.trim(),
            fecha:             fecha,
            hora_salida:       hora,
            cupos_total:       parseInt(cupos),
            cupos_disponibles: parseInt(cupos),
            precio_persona:    parseFloat(precio) || 0,
            ruta_opcional:     ruta || null,
            notas:             notas || null,
            estado:            'disponible'
        }])
        .select()
        .single();

    if (error) throw new Error('Error al publicar viaje: ' + error.message);

    await registrarEvento(conductorId, 'publicacion_viaje', `Viaje publicado: ${origen} -> ${destino}`, data.id);
    return data;
}

// ── RF4: Buscar viajes ───────────────────────────────────────

export async function buscarViajes({ origen, destino, fecha, cupos } = {}) {
    let query = supabase
        .from('viajes')
        .select(`*, conductor:usuarios!conductor_id(id, nombre, calificacion_prom, total_viajes, verificado)`)
        .eq('estado', 'disponible')
        .gt('cupos_disponibles', 0)
        .order('fecha', { ascending: true })
        .order('hora_salida', { ascending: true });

    if (origen)  query = query.ilike('origen', `%${origen}%`);
    if (destino) query = query.ilike('destino', `%${destino}%`);
    if (fecha)   query = query.eq('fecha', fecha);
    if (cupos)   query = query.gte('cupos_disponibles', parseInt(cupos));

    const { data, error } = await query;
    if (error) throw new Error('Error al buscar viajes: ' + error.message);
    return data || [];
}

// ── RF5: Enviar solicitud ────────────────────────────────────

export async function enviarSolicitud(viajeId, pasajeroId, asientos = 1) {
    const { data: viaje } = await supabase
        .from('viajes')
        .select('cupos_disponibles, conductor_id')
        .eq('id', viajeId)
        .single();

    if (!viaje) throw new Error('Viaje no encontrado.');
    if (viaje.conductor_id === pasajeroId) throw new Error('No puedes solicitar tu propio viaje.');
    if (viaje.cupos_disponibles < asientos) throw new Error('No hay suficientes cupos disponibles.');

    const { data, error } = await supabase
        .from('solicitudes')
        .insert([{ viaje_id: viajeId, pasajero_id: pasajeroId, asientos, estado: 'pendiente' }])
        .select()
        .single();

    if (error) {
        if (error.code === '23505') throw new Error('Ya enviaste una solicitud para este viaje.');
        throw new Error('Error al enviar solicitud: ' + error.message);
    }

    await registrarEvento(pasajeroId, 'solicitud_enviada', 'Solicitud enviada', viajeId);
    return data;
}

// ── RF6: Gestionar solicitudes (conductor) ───────────────────

export async function responderSolicitud(solicitudId, accion, conductorId) {
    const { data: sol } = await supabase
        .from('solicitudes')
        .select('*, viaje:viajes(cupos_disponibles, conductor_id)')
        .eq('id', solicitudId)
        .single();

    if (!sol) throw new Error('Solicitud no encontrada.');
    if (sol.viaje.conductor_id !== conductorId) throw new Error('No tienes permiso.');

    const nuevoEstado = accion === 'aceptar' ? 'aceptada' : 'rechazada';

    const { data, error } = await supabase
        .from('solicitudes')
        .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
        .eq('id', solicitudId)
        .select()
        .single();

    if (error) throw new Error('Error al responder: ' + error.message);

    // Actualizar cupos si se acepto
    if (accion === 'aceptar') {
        await supabase
            .from('viajes')
            .update({ cupos_disponibles: sol.viaje.cupos_disponibles - sol.asientos })
            .eq('id', sol.viaje_id);
    }

    await registrarEvento(conductorId, `solicitud_${nuevoEstado}`, `Solicitud ${nuevoEstado}`, sol.viaje_id);
    return data;
}

// ── RF8: Calificar ───────────────────────────────────────────

export async function calificar({ viajeId, calificadorId, calificadoId, puntuacion, comentario, tipo }) {
    const { data, error } = await supabase
        .from('calificaciones')
        .insert([{ viaje_id: viajeId, calificador_id: calificadorId, calificado_id: calificadoId, puntuacion, comentario, tipo }])
        .select()
        .single();

    if (error) {
        if (error.code === '23505') throw new Error('Ya calificaste a este usuario en este viaje.');
        throw new Error('Error al calificar: ' + error.message);
    }

    // Recalcular promedio del calificado
    const { data: cals } = await supabase
        .from('calificaciones')
        .select('puntuacion')
        .eq('calificado_id', calificadoId);

    if (cals && cals.length > 0) {
        const prom = cals.reduce((s, c) => s + c.puntuacion, 0) / cals.length;
        await supabase
            .from('usuarios')
            .update({ calificacion_prom: Math.round(prom * 10) / 10, total_viajes: cals.length })
            .eq('id', calificadoId);
    }

    await registrarEvento(calificadorId, 'calificacion', `Calificacion enviada: ${puntuacion} estrellas`, viajeId);
    return data;
}

// ── RF10: Reportar usuario ───────────────────────────────────

export async function reportarUsuario({ reporteroId, reportadoId, viajeId, motivo, descripcion }) {
    const { data, error } = await supabase
        .from('reportes')
        .insert([{ reportero_id: reporteroId, reportado_id: reportadoId, viaje_id: viajeId || null, motivo, descripcion }])
        .select()
        .single();

    if (error) throw new Error('Error al enviar reporte: ' + error.message);

    await registrarEvento(reporteroId, 'reporte_enviado', `Reporte: ${motivo}`, reportadoId);
    return data;
}

// ── Trazabilidad (RNF4) ──────────────────────────────────────

export async function registrarEvento(usuarioId, tipo, descripcion, referenciaId = null) {
    await supabase.from('eventos_log').insert([{
        usuario_id:    usuarioId,
        tipo_evento:   tipo,
        descripcion:   descripcion,
        referencia_id: referenciaId
    }]);
}

// ── Admin: obtener reportes ──────────────────────────────────

export async function obtenerReportes() {
    const { data, error } = await supabase
        .from('reportes')
        .select(`*, reportero:usuarios!reportero_id(nombre, email), reportado:usuarios!reportado_id(nombre, email)`)
        .order('created_at', { ascending: false });

    if (error) throw new Error('Error al obtener reportes: ' + error.message);
    return data || [];
}

export async function obtenerUsuarios() {
    const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, email, rol, matricula, calificacion_prom, estado, verificado, created_at')
        .order('created_at', { ascending: false });

    if (error) throw new Error('Error al obtener usuarios: ' + error.message);
    return data || [];
}

export async function suspenderUsuario(usuarioId, adminId) {
    const { data, error } = await supabase
        .from('usuarios')
        .update({ estado: 'suspendido' })
        .eq('id', usuarioId)
        .select()
        .single();

    if (error) throw new Error('Error al suspender: ' + error.message);
    await registrarEvento(adminId, 'suspension', 'Usuario suspendido', usuarioId);
    return data;
}

export async function resolverReporte(reporteId, accion, adminId) {
    const { data, error } = await supabase
        .from('reportes')
        .update({ estado: 'resuelto', accion_admin: accion, updated_at: new Date().toISOString() })
        .eq('id', reporteId)
        .select()
        .single();

    if (error) throw new Error('Error al resolver reporte: ' + error.message);
    await registrarEvento(adminId, 'reporte_resuelto', `Accion: ${accion}`, reporteId);
    return data;
}
