# Diagnóstico de Problemas de Carga de Datos

## Problema Reportado
María González (Conductor/Pasajero) no ve los datos de viajes, pero Carlos sí.

## Pasos para Diagnosticar

### 1. Abre la Consola del Navegador
- Presiona `F12` en tu navegador
- Ve a la pestaña **"Console"**
- Inicia sesión como María González
- Ve a "Buscar Viajes" o "Mis Viajes"
- **Copia TODO lo que aparezca en la consola** (los console.log que agregué)

### 2. Ejecuta estos scripts SQL en Supabase

#### Script 1: Diagnóstico de María González
Ve a: https://supabase.com/dashboard/project/qwszgjivoknjhhswiatz/editor

Copia y ejecuta el contenido de:
```
database/10_diagnostico_maria.sql
```

**Qué buscar:**
- ¿Aparece María González en la tabla usuarios?
- ¿Cuál es su ID?
- ¿Cuál es su `modo_actual`?
- ¿Tiene `placa_vehiculo` registrada?

#### Script 2: Verificar Estado de Viajes
Copia y ejecuta el contenido de:
```
database/11_verificar_viajes_estado.sql
```

**Qué buscar:**
- ¿Cuántos viajes hay en total?
- ¿Cuántos viajes tienen `estado = 'disponible'`?
- ¿Cuántos viajes tienen `cupos_disponibles > 0`?
- ¿Los viajes de María están en la lista de "viajes que deberían aparecer"?

### 3. Verifica las Políticas RLS

En Supabase, ve a **Database → Policies** y busca la tabla `viajes`:

**Debe haber estas políticas:**
- `viajes_select` - FOR SELECT TO anon, authenticated
- `viajes_insert` - FOR INSERT TO anon, authenticated
- `viajes_update` - FOR UPDATE TO anon, authenticated

Si no están, ejecuta:
```
database/09_fix_rls_y_permisos.sql
```

### 4. Verifica los Permisos de la Anon Key

En Supabase, ve a **Database → Roles** y busca el rol `anon`:

Debe tener permisos SELECT, INSERT, UPDATE, DELETE en:
- usuarios
- viajes
- solicitudes
- calificaciones
- reportes
- eventos_log

### 5. Compara con Carlos

Ejecuta este SQL para comparar:

```sql
-- Ver datos de María González
SELECT id, nombre, email, rol, modo_actual, placa_vehiculo, estado, verificado
FROM usuarios
WHERE nombre ILIKE '%maria%';

-- Ver datos de Carlos
SELECT id, nombre, email, rol, modo_actual, placa_vehiculo, estado, verificado
FROM usuarios
WHERE nombre ILIKE '%carlos%';

-- Ver viajes de María
SELECT v.id, v.conductor_id, v.origen, v.destino, v.estado, v.cupos_disponibles
FROM viajes v
WHERE v.conductor_id IN (SELECT id FROM usuarios WHERE nombre ILIKE '%maria%');

-- Ver viajes de Carlos
SELECT v.id, v.conductor_id, v.origen, v.destino, v.estado, v.cupos_disponibles
FROM viajes v
WHERE v.conductor_id IN (SELECT id FROM usuarios WHERE nombre ILIKE '%carlos%');
```

## Posibles Causas

### 1. Viajes de María no tienen `estado = 'disponible'`
**Solución:** Actualizar el estado en Supabase:
```sql
UPDATE viajes
SET estado = 'disponible'
WHERE conductor_id IN (SELECT id FROM usuarios WHERE nombre ILIKE '%maria%')
AND estado != 'disponible';
```

### 2. Viajes de María tienen `cupos_disponibles = 0`
**Solución:** Restaurar los cupos:
```sql
UPDATE viajes
SET cupos_disponibles = cupos_total
WHERE conductor_id IN (SELECT id FROM usuarios WHERE nombre ILIKE '%maria%');
```

### 3. María no tiene `modo_actual = 'conductor'`
**Solución:** Actualizar el modo:
```sql
UPDATE usuarios
SET modo_actual = 'conductor'
WHERE nombre ILIKE '%maria%' AND placa_vehiculo IS NOT NULL;
```

### 4. Políticas RLS no están correctas
**Solución:** Ejecutar:
```
database/09_fix_rls_y_permisos.sql
```

### 5. Permisos de anon key no están correctos
**Solución:** Ejecutar:
```
database/09_fix_rls_y_permisos.sql
```

## Información que Necesito

Para ayudarte mejor, proporciona:

1. **Consola del navegador** (F12 → Console) cuando entras como María y vas a "Buscar Viajes"
2. **Resultado del Script 1** (10_diagnostico_maria.sql)
3. **Resultado del Script 2** (11_verificar_viajes_estado.sql)
4. **Confirmación** de que ejecutaste el Script 09 (09_fix_rls_y_permisos.sql)

## Checklist de Verificación

- [ ] Ejecuté 09_fix_rls_y_permisos.sql
- [ ] Ejecuté 10_diagnostico_maria.sql y revisé los resultados
- [ ] Ejecuté 11_verificar_viajes_estado.sql y revisé los resultados
- [ ] Verifiqué que María tiene modo_actual = 'conductor' o 'pasajero'
- [ ] Verifiqué que los viajes tienen estado = 'disponible'
- [ ] Verifiqué que los viajes tienen cupos_disponibles > 0
- [ ] Abrí la consola (F12) y revisé los console.log
