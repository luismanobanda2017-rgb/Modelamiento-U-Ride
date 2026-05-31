-- ============================================================
-- U-Ride UTA - Script 07: Modo pasajero/conductor y vehiculo
-- Ejecutar en Supabase SQL Editor si la tabla usuarios ya existe
-- ============================================================

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS placa_vehiculo TEXT,
ADD COLUMN IF NOT EXISTS modelo_vehiculo TEXT,
ADD COLUMN IF NOT EXISTS modo_actual TEXT NOT NULL DEFAULT 'pasajero';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'usuarios_modo_actual_check'
    ) THEN
        ALTER TABLE usuarios
        ADD CONSTRAINT usuarios_modo_actual_check
        CHECK (modo_actual IN ('pasajero', 'conductor'));
    END IF;
END $$;

UPDATE usuarios
SET modo_actual = 'conductor'
WHERE placa_vehiculo IS NOT NULL
  AND btrim(placa_vehiculo) <> '';
