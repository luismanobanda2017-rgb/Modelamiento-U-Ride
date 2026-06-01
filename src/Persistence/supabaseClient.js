// ============================================================
// U-Ride UTA - supabaseClient.js
// Capa de Persistencia: conexion a Supabase
// Auth: supabase.auth (correos reales via SMTP Gmail)
// Proyecto: qwszgjivoknjhhswiatz
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL     = 'https://qwszgjivoknjhhswiatz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3c3pnaml2b2tuamhoc3dpYXR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MTczNzYsImV4cCI6MjA5NDA5MzM3Nn0.IjQ9PWCIQe6owRAzS3jV-i-Xhi65Zj3eQcGi0D4utxI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// URL base para redirecciones de auth (GitHub Pages)
const SITE_URL = 'https://luismanobanda2017-rgb.github.io/Modelamiento-U-Ride/src/Web_Visual';

// Selección explícita de columnas conocidas para evitar errores si la columna
// `modelo_vehiculo` no está presente en el esquema (workaround temporal).
const safeSelectCols = `id,nombre,email,rol,matricula,placa_vehiculo,modo_actual,calificacion_prom,total_viajes,estado,verificado,created_at,password_hash,telefono,carrera,zona_referencia,foto_url,updated_at`;

// ── Sesion local ─────────────────────────────────────────────

export function obtenerUsuarioActual() {
    const raw = localStorage.getItem('uride_usuario');
    return raw ? JSON.parse(raw) : null;
}

function guardarSesion(usuario) {
    localStorage.setItem('uride_usuario', JSON.stringify(usuario));
}

// Refresca el perfil del usuario desde Supabase y actualiza el localStorage
export async function refrescarPerfil() {
    const local = obtenerUsuarioActual();
    if (!local) return null;

    let res = await supabase.from('usuarios').select('*').eq('id', local.id).maybeSingle();
    if (res.error) {
        // Reintentar sin modelo_vehiculo si la columna no existe
        const msg = String(res.error.message || '').toLowerCase();
        if (msg.includes('modelo_vehiculo')) {
            res = await supabase.from('usuarios').select(safeSelectCols).eq('id', local.id).maybeSingle();
        }
    }
    if (res.data) {
        guardarSesion(res.data);
        return res.data;
    }
    return local;
}

export async function cerrarSesion() {
    await supabase.auth.signOut();
    localStorage.removeItem('uride_usuario');
    window.location.href = 'index.html';
}

// ── RF1: Registro con correo institucional ────────────────────
// Usa supabase.auth.signUp → Supabase envia correo de confirmacion real

export async function registrarUsuario({ nombre, email, password, rol, telefono, carrera, zona, matricula, placa, modeloVehiculo }) {
    const emailNorm = email.trim().toLowerCase();

    if (!emailNorm.endsWith('@uta.edu.ec')) {
        throw new Error('Debes usar tu correo institucional (@uta.edu.ec).');
    }

    // Registrar en supabase.auth (envia correo de verificacion automaticamente)
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email:    emailNorm,
        password: password,
        options: {
            emailRedirectTo: `${SITE_URL}/verificar-ok.html`,
            data: {
                nombre:    nombre.trim(),
                rol:       rol || 'pasajero',
                matricula: matricula || ''
            }
        }
    });

    if (authError) {
        if (authError.message.includes('already registered')) {
            throw new Error('Ese correo ya esta registrado.');
        }
        throw new Error('Error al registrar: ' + authError.message);
    }

    const authId = authData.user?.id;
    if (!authId) throw new Error('Error al crear cuenta. Intenta de nuevo.');

    // Guardar datos extra en nuestra tabla usuarios
    // Intentar insertar incluyendo modelo_vehiculo; si la columna no existe en la DB,
    // reintentar sin esa columna (retrocompatibilidad con esquemas antiguos).
    const insertPayload = {
        id:              authId,
        nombre:          nombre.trim(),
        email:           emailNorm,
        password_hash:   btoa(`${password}_uta_salt`),
        rol:             rol || 'pasajero',
        telefono:        telefono || null,
        carrera:         carrera  || null,
        zona_referencia: zona     || null,
        matricula:       matricula || null,
        placa_vehiculo:  placa?.trim() || null,
        modelo_vehiculo: modeloVehiculo?.trim() || null,
        modo_actual:     placa?.trim() ? 'conductor' : 'pasajero',
        verificado:      false,
        estado:          'pendiente_verificacion'
    };

    let res = await supabase.from('usuarios').insert([insertPayload]).select('*').single();
    if (res.error) {
        const msg = String(res.error.message || '').toLowerCase();
        if (msg.includes('modelo_vehiculo') || msg.includes("column \"modelo_vehiculo\"")) {
            // reintentar sin modelo_vehiculo
            delete insertPayload.modelo_vehiculo;
            res = await supabase.from('usuarios').insert([insertPayload]).select(safeSelectCols).single();
        }
    }

    const { data, error } = res;
    if (error && error.code !== '23505') {
        throw new Error('Error al guardar perfil: ' + error.message);
    }

    await registrarEvento(authId, 'registro', 'Nuevo usuario registrado');

    // Guardar email para la pagina de verificacion
    sessionStorage.setItem('uride_email_verificar', emailNorm);

    return data || { email: emailNorm };
}

// ── RF1: Inicio de sesion ─────────────────────────────────────

export async function iniciarSesion(email, password) {
    const emailNorm = email.trim().toLowerCase();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email:    emailNorm,
        password: password
    });

    if (authError) {
        if (authError.message.includes('Email not confirmed')) {
            sessionStorage.setItem('uride_email_verificar', emailNorm);
            throw new Error('PENDIENTE_VERIFICACION');
        }
        throw new Error('Correo o contraseña incorrectos.');
    }

    // Obtener datos del perfil desde nuestra tabla
    const { data: perfil, error: perfilError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

    if (perfilError || !perfil) {
        throw new Error('No se encontro el perfil. Contacta al administrador.');
    }

    if (perfil.estado === 'suspendido') {
        await supabase.auth.signOut();
        throw new Error('Tu cuenta esta suspendida. Contacta al administrador.');
    }

    // Marcar como verificado si auth lo confirmo
    if (authData.user.email_confirmed_at && !perfil.verificado) {
        await supabase
            .from('usuarios')
            .update({ verificado: true, estado: 'activo' })
            .eq('id', perfil.id);
        perfil.verificado = true;
        perfil.estado     = 'activo';
    }

    guardarSesion(perfil);
    await registrarEvento(perfil.id, 'login', 'Inicio de sesion');
    return perfil;
}

// ── Recuperacion de contrasena ────────────────────────────────
// supabase.auth envia el correo de recuperacion automaticamente

export async function solicitarRecuperacion(email) {
    const emailNorm = email.trim().toLowerCase();

    if (!emailNorm.endsWith('@uta.edu.ec')) {
        throw new Error('Ingresa tu correo institucional (@uta.edu.ec).');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(emailNorm, {
        redirectTo: `${SITE_URL}/nueva-password.html`
    });

    if (error) throw new Error('Error al enviar correo: ' + error.message);

    sessionStorage.setItem('uride_email_recuperar', emailNorm);
    return { mensaje: 'Correo de recuperacion enviado. Revisa tu bandeja.' };
}

// ── Nueva contrasena (desde link del correo) ──────────────────

export async function actualizarPassword(nuevaPassword) {
    const { error } = await supabase.auth.updateUser({ password: nuevaPassword });
    if (error) throw new Error('Error al actualizar: ' + error.message);

    // Actualizar hash en nuestra tabla tambien
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        await supabase
            .from('usuarios')
            .update({ password_hash: btoa(`${nuevaPassword}_uta_salt`) })
            .eq('id', user.id);
        await registrarEvento(user.id, 'recuperacion_contrasena', 'Contrasena actualizada');
    }
}

// ── RF2: Edicion de perfil ────────────────────────────────────

export async function editarPerfil(usuarioId, { nombre, telefono, carrera, zona, foto_url, placa, modeloVehiculo, modoActual }) {
    if (modoActual === 'conductor' && !placa?.trim()) {
        throw new Error('Para activar el rol Conductor debes completar tu placa en el perfil.');
    }
    // Construir payload y permitir reintento si la columna modelo_vehiculo no existe
    const updatePayload = {
        ...(nombre !== undefined ? { nombre: nombre?.trim() || undefined } : {}),
        telefono:        telefono || null,
        carrera:         carrera  || null,
        zona_referencia: zona     || null,
        foto_url:        foto_url || null,
        placa_vehiculo:  placa?.trim() || null,
        modelo_vehiculo: modeloVehiculo?.trim() || null,
        modo_actual:     modoActual || 'pasajero',
        updated_at:      new Date().toISOString()
    };

    let upd = await supabase.from('usuarios').update(updatePayload).eq('id', usuarioId).select('*').single();
    if (upd.error) {
        const msg = String(upd.error.message || '').toLowerCase();
        if (msg.includes('modelo_vehiculo') || msg.includes("column \"modelo_vehiculo\"")) {
            // reintentar sin la columna modelo_vehiculo
            delete updatePayload.modelo_vehiculo;
            upd = await supabase.from('usuarios').update(updatePayload).eq('id', usuarioId).select(safeSelectCols).single();
        }
    }

    const { data, error } = upd;
    if (error) throw new Error('Error al actualizar perfil: ' + error.message);

    guardarSesion(data);
    await registrarEvento(usuarioId, 'edicion_perfil', 'Perfil actualizado');
    return data;
}

// ── RF3: Publicar viaje ───────────────────────────────────────

export async function publicarViaje({ conductorId, origen, destino, fecha, hora, cupos, precio, ruta, notas }) {
    const cuposNum = parseInt(cupos);
    if (cuposNum < 1 || cuposNum > 4) {
        throw new Error('El viaje puede tener entre 1 y 4 asientos.');
    }

    const { data, error } = await supabase
        .from('viajes')
        .insert([{
            conductor_id:      conductorId,
            origen:            origen.trim(),
            destino:           destino.trim(),
            fecha:             fecha,
            hora_salida:       hora,
            cupos_total:       cuposNum,
            cupos_disponibles: cuposNum,
            precio_persona:    parseFloat(precio) || 0,
            ruta_opcional:     ruta   || null,
            notas:             notas  || null,
            estado:            'disponible'
        }])
        .select()
        .single();

    if (error) throw new Error('Error al publicar viaje: ' + error.message);

    await registrarEvento(conductorId, 'publicacion_viaje', `Viaje: ${origen} -> ${destino}`, data.id);
    return data;
}

// ── RF4: Buscar viajes ────────────────────────────────────────

export async function buscarViajes({ origen, destino, fecha, cupos } = {}) {
    let query = supabase
        .from('viajes')
        .select(`*, conductor:usuarios!conductor_id(id, nombre, calificacion_prom, total_viajes, verificado)`)
        .eq('estado', 'disponible')
        .gt('cupos_disponibles', 0)
        .order('fecha',       { ascending: true })
        .order('hora_salida', { ascending: true });

    if (origen)  query = query.ilike('origen',  `%${origen}%`);
    if (destino) query = query.ilike('destino', `%${destino}%`);
    if (fecha)   query = query.eq('fecha', fecha);
    if (cupos)   query = query.gte('cupos_disponibles', parseInt(cupos));

    const { data, error } = await query;
    if (error) throw new Error('Error al buscar viajes: ' + error.message);
    return data || [];
}

// ── RF5: Enviar solicitud ─────────────────────────────────────

export async function enviarSolicitud(viajeId, pasajeroId, asientos = 1) {
    const asientosNum = parseInt(asientos);
    if (asientosNum < 1 || asientosNum > 4) {
        throw new Error('Puedes solicitar entre 1 y 4 asientos.');
    }

    const { data: viaje } = await supabase
        .from('viajes')
        .select('cupos_disponibles, conductor_id')
        .eq('id', viajeId)
        .single();

    if (!viaje) throw new Error('Viaje no encontrado.');
    if (viaje.conductor_id === pasajeroId) throw new Error('No puedes solicitar tu propio viaje.');
    if (viaje.cupos_disponibles < asientosNum) throw new Error('No hay suficientes cupos disponibles.');

    const { data, error } = await supabase
        .from('solicitudes')
        .insert([{ viaje_id: viajeId, pasajero_id: pasajeroId, asientos: asientosNum, estado: 'pendiente' }])
        .select()
        .single();

    if (error) {
        if (error.code === '23505') throw new Error('Ya enviaste una solicitud para este viaje.');
        throw new Error('Error al enviar solicitud: ' + error.message);
    }

    await registrarEvento(pasajeroId, 'solicitud_enviada', 'Solicitud enviada', viajeId);
    return data;
}

// ── RF6: Gestionar solicitudes ────────────────────────────────

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

    if (accion === 'aceptar') {
        await supabase
            .from('viajes')
            .update({ cupos_disponibles: sol.viaje.cupos_disponibles - sol.asientos })
            .eq('id', sol.viaje_id);
    }

    await registrarEvento(conductorId, `solicitud_${nuevoEstado}`, `Solicitud ${nuevoEstado}`, sol.viaje_id);
    return data;
}

// ── RF8: Calificar ────────────────────────────────────────────

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

    await registrarEvento(calificadorId, 'calificacion', `${puntuacion} estrellas`, viajeId);
    return data;
}

// ── RF10: Reportar usuario ────────────────────────────────────

export async function reportarUsuario({ reporteroId, reportadoId, viajeId, motivo, descripcion, evidenciaUrl, evidenciaLink }) {
    const { data, error } = await supabase
        .from('reportes')
        .insert([{
            reportero_id:  reporteroId,
            reportado_id:  reportadoId,
            viaje_id:      viajeId || null,
            motivo,
            descripcion,
            evidencia_url:  evidenciaUrl  || null,
            evidencia_link: evidenciaLink || null
        }])
        .select()
        .single();

    if (error) throw new Error('Error al enviar reporte: ' + error.message);
    await registrarEvento(reporteroId, 'reporte_enviado', `Reporte: ${motivo}`, reportadoId);
    return data;
}

export async function subirEvidenciaReporte(archivo, usuarioId) {
    if (!archivo) return null;

    const extension = archivo.name.split('.').pop() || 'bin';
    const nombreArchivo = `${usuarioId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
        .from('evidencias-reportes')
        .upload(nombreArchivo, archivo, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        const msg = String(error.message || '').toLowerCase();
        if (msg.includes('bucket') && msg.includes('not found')) {
            throw new Error("Error al subir evidencia: el bucket 'evidencias-reportes' no existe en Supabase Storage. Crea un bucket con ese nombre en Storage → Buckets y dale permisos públicos, o ajusta el nombre del bucket en src/Persistence/supabaseClient.js");
        }
        throw new Error('Error al subir evidencia: ' + error.message);
    }

    const { data } = supabase.storage
        .from('evidencias-reportes')
        .getPublicUrl(nombreArchivo);

    return data.publicUrl;
}

// ── Trazabilidad RNF4 ─────────────────────────────────────────

export async function registrarEvento(usuarioId, tipo, descripcion, referenciaId = null) {
    await supabase.from('eventos_log').insert([{
        usuario_id:    usuarioId,
        tipo_evento:   tipo,
        descripcion:   descripcion,
        referencia_id: referenciaId
    }]);
}

// ── Admin ─────────────────────────────────────────────────────

export async function obtenerReportes() {
    const { data, error } = await supabase
        .from('reportes')
        .select(`id, reportero_id, reportado_id, viaje_id, motivo, descripcion, evidencia_url, evidencia_link, estado, accion_admin, created_at, updated_at, reportero:usuarios!reportero_id(nombre, email), reportado:usuarios!reportado_id(nombre, email)`)
        .order('created_at', { ascending: false });
    if (error) throw new Error('Error: ' + error.message);
    return data || [];
}

export async function obtenerUsuarios() {
    const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, email, rol, matricula, placa_vehiculo, modelo_vehiculo, modo_actual, calificacion_prom, estado, verificado, created_at')
        .order('created_at', { ascending: false });
    if (error) throw new Error('Error: ' + error.message);
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
    if (error) throw new Error('Error: ' + error.message);
    await registrarEvento(adminId, 'reporte_resuelto', `Accion: ${accion}`, reporteId);
    return data;
}

// Sancionar: suspende al usuario reportado y marca el reporte como resuelto
export async function sancionarUsuario(reporteId, adminId) {
    // Obtener el reporte para saber quién es el reportado
    const { data: reporte, error: repErr } = await supabase
        .from('reportes')
        .select('reportado_id')
        .eq('id', reporteId)
        .single();
    if (repErr || !reporte) throw new Error('Reporte no encontrado.');

    // Suspender al usuario reportado
    const { error: suspErr } = await supabase
        .from('usuarios')
        .update({ estado: 'suspendido' })
        .eq('id', reporte.reportado_id);
    if (suspErr) throw new Error('Error al suspender usuario: ' + suspErr.message);

    // Marcar reporte como resuelto con acción sanción
    const { data, error } = await supabase
        .from('reportes')
        .update({ estado: 'resuelto', accion_admin: 'sancion_suspension', updated_at: new Date().toISOString() })
        .eq('id', reporteId)
        .select()
        .single();
    if (error) throw new Error('Error al resolver reporte: ' + error.message);

    await registrarEvento(adminId, 'sancion_suspension', 'Usuario suspendido por reporte', reporte.reportado_id);
    return data;
}

// Advertir: envía una advertencia al usuario reportado
export async function advertirUsuario(reporteId, adminId, mensaje) {
    // Obtener el reporte para saber quién es el reportado
    const { data: reporte, error: repErr } = await supabase
        .from('reportes')
        .select('reportado_id')
        .eq('id', reporteId)
        .single();
    if (repErr || !reporte) throw new Error('Reporte no encontrado.');

    // Insertar advertencia
    const { error: advErr } = await supabase
        .from('advertencias')
        .insert([{
            usuario_id: reporte.reportado_id,
            reporte_id: reporteId,
            admin_id:   adminId,
            mensaje:    mensaje,
            leida:      false
        }]);
    if (advErr) throw new Error('Error al enviar advertencia: ' + advErr.message);

    // Marcar reporte como resuelto con acción advertencia
    const { data, error } = await supabase
        .from('reportes')
        .update({ estado: 'resuelto', accion_admin: 'advertencia_enviada', updated_at: new Date().toISOString() })
        .eq('id', reporteId)
        .select()
        .single();
    if (error) throw new Error('Error al resolver reporte: ' + error.message);

    await registrarEvento(adminId, 'advertencia_enviada', `Advertencia: ${mensaje}`, reporte.reportado_id);
    return data;
}

// Obtener advertencias no leídas del usuario actual
export async function obtenerAdvertenciasPendientes(usuarioId) {
    const { data, error } = await supabase
        .from('advertencias')
        .select('*')
        .eq('usuario_id', usuarioId)
        .eq('leida', false)
        .order('created_at', { ascending: false });
    if (error) throw new Error('Error al obtener advertencias: ' + error.message);
    return data || [];
}

// Marcar advertencia como leída (usuario hizo clic en "Entendido")
export async function marcarAdvertenciaLeida(advertenciaId) {
    const { error } = await supabase
        .from('advertencias')
        .update({ leida: true, updated_at: new Date().toISOString() })
        .eq('id', advertenciaId);
    if (error) throw new Error('Error al marcar advertencia: ' + error.message);
}
