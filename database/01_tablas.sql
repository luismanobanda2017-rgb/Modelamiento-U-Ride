-- ============================================================
-- U-Ride UTA - Script 01: Creacion de Tablas
-- Ejecutar en: Supabase SQL Editor
-- Proyecto: qwszgjivoknjhhswiatz
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabla principal de usuarios (estudiantes y admin)
CREATE TABLE IF NOT EXISTS usuarios (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre            TEXT NOT NULL,
    email             TEXT UNIQUE NOT NULL,
    password_hash     TEXT NOT NULL,
    rol               TEXT NOT NULL DEFAULT 'pasajero' CHECK (rol IN ('pasajero', 'conductor', 'admin')),
    telefono          TEXT,
    carrera           TEXT,
    zona_referencia   TEXT,
    foto_url          TEXT,
    matricula         TEXT,
    calificacion_prom FLOAT DEFAULT 0,
    total_viajes      INTEGER DEFAULT 0,
    estado            TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'suspendido', 'pendiente_verificacion')),
    codigo_verificacion TEXT,
    verificado        BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de viajes publicados por conductores
CREATE TABLE IF NOT EXISTS viajes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conductor_id    UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    origen          TEXT NOT NULL,
    destino         TEXT NOT NULL,
    fecha           DATE NOT NULL,
    hora_salida     TIME NOT NULL,
    cupos_total     INTEGER NOT NULL CHECK (cupos_total BETWEEN 1 AND 4),
    cupos_disponibles INTEGER NOT NULL,
    precio_persona  FLOAT DEFAULT 0,
    ruta_opcional   TEXT,
    notas           TEXT,
    estado          TEXT NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible', 'completo', 'cancelado', 'finalizado')),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de solicitudes de pasajeros para unirse a viajes
CREATE TABLE IF NOT EXISTS solicitudes (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    viaje_id     UUID NOT NULL REFERENCES viajes(id) ON DELETE CASCADE,
    pasajero_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    estado       TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptada', 'rechazada', 'cancelada')),
    asientos     INTEGER NOT NULL DEFAULT 1,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(viaje_id, pasajero_id)
);

-- Tabla de calificaciones (pasajero -> conductor y conductor -> pasajero)
CREATE TABLE IF NOT EXISTS calificaciones (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    viaje_id      UUID NOT NULL REFERENCES viajes(id) ON DELETE CASCADE,
    calificador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    calificado_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    puntuacion    INTEGER NOT NULL CHECK (puntuacion BETWEEN 1 AND 5),
    comentario    TEXT,
    tipo          TEXT NOT NULL CHECK (tipo IN ('pasajero_a_conductor', 'conductor_a_pasajero')),
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(viaje_id, calificador_id, calificado_id)
);

-- Tabla de reportes de conducta
CREATE TABLE IF NOT EXISTS reportes (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reportero_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    reportado_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    viaje_id      UUID REFERENCES viajes(id) ON DELETE SET NULL,
    motivo        TEXT NOT NULL,
    descripcion   TEXT,
    evidencia_url TEXT,
    estado        TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'revisado', 'resuelto')),
    accion_admin  TEXT,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de log de eventos clave (trazabilidad RNF4)
CREATE TABLE IF NOT EXISTS eventos_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id  UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    tipo_evento TEXT NOT NULL,
    descripcion TEXT,
    referencia_id UUID,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para rendimiento
CREATE INDEX IF NOT EXISTS idx_viajes_conductor ON viajes(conductor_id);
CREATE INDEX IF NOT EXISTS idx_viajes_estado ON viajes(estado, fecha);
CREATE INDEX IF NOT EXISTS idx_viajes_origen ON viajes(origen);
CREATE INDEX IF NOT EXISTS idx_solicitudes_viaje ON solicitudes(viaje_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_pasajero ON solicitudes(pasajero_id);
CREATE INDEX IF NOT EXISTS idx_calificaciones_calificado ON calificaciones(calificado_id);
CREATE INDEX IF NOT EXISTS idx_reportes_estado ON reportes(estado);
CREATE INDEX IF NOT EXISTS idx_reportes_reportado ON reportes(reportado_id);
