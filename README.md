# U-Ride — Transporte Seguro Compartido para Estudiantes UTA

Sistema web de viajes compartidos para estudiantes de la Universidad Técnica de Ambato.
Materia: **Modelamiento y Diseño de Software** · Ciclo Enero 2026 – Julio 2026

## Equipo

| Nombre | Módulo |
|---|---|
| Manobanda Masabanda Luis Alfredo | Gestión de Usuario / Admin |
| Curillo Pilamunga Diego Alexander | Gestión de Viaje (Conductor) |
| Borja Guapulema Johan Josué | Gestión de Viaje (Pasajero) |
| Quispe Nasimba Daniela Alejandra | Casos de Uso |

## Sitio público

GitHub Pages: `https://luismanobanda2017-rgb.github.io/Modelamiento-U-Ride/`

El `index.html` de la raíz redirige a `src/Web_Visual/index.html`

## Funcionalidades implementadas (revisión semana 1)

- ✅ **RF1 — Registro** con correo institucional `@uta.edu.ec` + código de verificación
- ✅ **RF1 — Inicio de sesión** con validación de estado de cuenta
- ✅ **Recuperación de contraseña** por código de 6 dígitos
- ✅ **RF2 — Edición de perfil** (nombre, teléfono, carrera, zona, contraseña)

## Funcionalidades completas

- RF3 — Publicar viaje (conductor)
- RF4 — Buscar y filtrar viajes (pasajero)
- RF5 — Enviar solicitud de viaje
- RF6 — Aceptar/rechazar solicitudes (conductor)
- RF7 — Confirmación de participación
- RF8 — Calificación y reseña post-viaje
- RF9 — Reglas de seguridad visibles
- RF10 — Reportar usuario por conducta indebida
- RF11 — Panel administrativo (revisar reportes, suspender usuarios)

## Estructura

```
src/
  Web_Visual/          HTML + CSS (interfaz)
  Persistence/         Conexión a Supabase (supabaseClient.js)

database/
  01_tablas.sql        Crear tablas en Supabase
  02_politicas_rls.sql Políticas de seguridad RLS
  03_datos_prueba.sql  Datos de prueba (opcional)
```

## Base de datos (Supabase)

Proyecto: `https://qwszgjivoknjhhswiatz.supabase.co`

Ejecutar en Supabase SQL Editor en orden:
```
database/01_tablas.sql
database/02_politicas_rls.sql
database/03_datos_prueba.sql   ← opcional
```

### Cuentas de prueba (contraseña: `123456`)

| Rol | Correo |
|---|---|
| Admin | admin@uta.edu.ec |
| Conductor | carlos.mendez@uta.edu.ec |
| Pasajero | maria.gonzalez@uta.edu.ec |

## Ejecutar localmente

Abre con Live Server (VS Code):
```
src/Web_Visual/index.html
```

## Requerimientos no funcionales

- **RNF1 Seguridad:** contraseñas con hash base64+salt, roles por usuario
- **RNF2 Privacidad:** ubicación por zonas/barrios, sin coordenadas exactas
- **RNF3 Usabilidad:** interfaz responsive, adaptada para móvil
- **RNF4 Trazabilidad:** tabla `eventos_log` registra publicación, aceptación, cancelación, finalización

## GitHub Pages

1. Ve a `Settings` → `Pages`
2. Source: `Deploy from a branch`
3. Branch: `main`, Folder: `/ (root)`
4. Guardar
