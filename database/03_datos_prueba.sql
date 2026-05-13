-- ============================================================
-- U-Ride UTA - Script 03: Datos de Prueba (Opcional)
-- Ejecutar despues de 02_politicas_rls.sql
-- Contrasena de todos: 123456
-- Hash = base64('123456_uta_salt') = MTIzNDU2X3V0YV9zYWx0
-- ============================================================

INSERT INTO usuarios (nombre, email, password_hash, rol, telefono, carrera, zona_referencia, matricula, verificado, estado)
VALUES
    ('Admin UTA',       'admin@uta.edu.ec',          'MTIzNDU2X3V0YV9zYWx0', 'admin',     '0987654321', NULL,                  NULL,           'ADMIN001',  TRUE, 'activo'),
    ('Carlos Mendez',   'carlos.mendez@uta.edu.ec',  'MTIzNDU2X3V0YV9zYWx0', 'conductor', '0991234567', 'Ingenieria en Sistemas', 'Zona Norte',  '20210001',  TRUE, 'activo'),
    ('Maria Gonzalez',  'maria.gonzalez@uta.edu.ec', 'MTIzNDU2X3V0YV9zYWx0', 'pasajero',  '0992345678', 'Carrera de Software',    'Zona Sur',    '20210002',  TRUE, 'activo'),
    ('Luis Rodriguez',  'luis.rodriguez@uta.edu.ec', 'MTIzNDU2X3V0YV9zYWx0', 'conductor', '0993456789', 'Electronica',            'Centro',      '20200015',  TRUE, 'activo')
ON CONFLICT (email) DO NOTHING;
