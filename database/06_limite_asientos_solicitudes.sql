-- ============================================================
-- U-Ride UTA - Script 06: Limite de asientos por solicitud
-- Ejecutar en Supabase SQL Editor si la tabla ya existe
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'solicitudes_asientos_check'
    ) THEN
        ALTER TABLE solicitudes
        ADD CONSTRAINT solicitudes_asientos_check
        CHECK (asientos BETWEEN 1 AND 4);
    END IF;
END $$;
