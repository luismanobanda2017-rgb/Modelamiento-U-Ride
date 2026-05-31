-- ============================================================
-- U-Ride UTA - Eliminar usuario por completo
-- Ejecutar en: Supabase SQL Editor (como postgres / service role)
-- Proyecto: qwszgjivoknjhhswiatz
--
-- Elimina:
--   - public.usuarios y datos relacionados (CASCADE)
--   - auth.users (cuenta de login / correo de verificación)
-- ============================================================

DO $$
DECLARE
    target_email TEXT := 'dquispe1051@uta.edu.ec';
    uid          UUID;
BEGIN
    SELECT id INTO uid
    FROM public.usuarios
    WHERE lower(email) = lower(target_email);

    IF uid IS NULL THEN
        SELECT id INTO uid
        FROM auth.users
        WHERE lower(email) = lower(target_email);
    END IF;

    IF uid IS NULL THEN
        RAISE NOTICE 'No se encontró usuario con email: %', target_email;
        RETURN;
    END IF;

    RAISE NOTICE 'Eliminando usuario % (id: %)', target_email, uid;

    -- Perfil y datos de app (viajes, solicitudes, calificaciones, reportes en CASCADE)
    DELETE FROM public.usuarios WHERE id = uid;

    -- Cuenta Supabase Auth (permite volver a registrarse con el mismo correo)
    DELETE FROM auth.users WHERE id = uid;

    RAISE NOTICE 'Usuario eliminado por completo.';
END $$;

-- Verificación (debe devolver 0 filas en ambas consultas)
SELECT id, email FROM public.usuarios WHERE lower(email) = 'dquispe1051@uta.edu.ec';
SELECT id, email FROM auth.users WHERE lower(email) = 'dquispe1051@uta.edu.ec';
