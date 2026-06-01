# Pasos para Arreglar el Problema de María González

## Resumen del Problema
María González no ve los viajes, pero Carlos sí. Esto puede ser por:
1. Los viajes de María no tienen `estado = 'disponible'`
2. Los viajes de María tienen `cupos_disponibles = 0`
3. María no tiene `modo_actual` correcto
4. Problemas con RLS o permisos

## Solución Rápida (Recomendado)

### Paso 1: Ejecuta el Script de Corrección
Ve a: https://supabase.com/dashboard/project/qwszgjivoknjhhswiatz/editor

1. Haz clic en **"+ New Query"**
2. Copia TODO el contenido de: `database/12_corregir_datos_maria.sql`
3. Pega en el editor SQL
4. Haz clic en **"Run"**

**Esto hará:**
- ✅ Verificar que María existe
- ✅ Marcar a María como verificada y activa
- ✅ Establecer su `modo_actual` correcto
- ✅ Restaurar sus viajes a estado `disponible`
- ✅ Restaurar los cupos disponibles
- ✅ Mostrar un resumen de los cambios

### Paso 2: Verifica que las Políticas RLS están correctas
1. Haz clic en **"+ New Query"**
2. Copia TODO el contenido de: `database/09_fix_rls_y_permisos.sql`
3. Pega en el editor SQL
4. Haz clic en **"Run"**

**Esto hará:**
- ✅ Reaplica todas las políticas RLS
- ✅ Agrega permisos explícitos a la anon key
- ✅ Muestra un conteo de registros

### Paso 3: Prueba en la App
1. Abre la app en tu navegador
2. Cierra sesión (si estás dentro)
3. Inicia sesión como María González
4. Ve a "Buscar Viajes" o "Mis Viajes"
5. **Abre la consola (F12) y revisa si hay errores**

---

## Solución Detallada (Si la rápida no funciona)

### Paso 1: Diagnóstico
1. Ve a: https://supabase.com/dashboard/project/qwszgjivoknjhhswiatz/editor
2. Haz clic en **"+ New Query"**
3. Copia TODO el contenido de: `database/10_diagnostico_maria.sql`
4. Pega y ejecuta
5. **Revisa los resultados:**
   - ¿Aparece María González?
   - ¿Cuál es su ID?
   - ¿Cuál es su `modo_actual`?
   - ¿Tiene `placa_vehiculo`?

### Paso 2: Verificar Viajes
1. Haz clic en **"+ New Query"**
2. Copia TODO el contenido de: `database/11_verificar_viajes_estado.sql`
3. Pega y ejecuta
4. **Revisa los resultados:**
   - ¿Cuántos viajes hay en total?
   - ¿Cuántos tienen `estado = 'disponible'`?
   - ¿Cuántos tienen `cupos_disponibles > 0`?
   - ¿Los viajes de María están en la lista?

### Paso 3: Corregir Manualmente (si es necesario)

Si los viajes de María no aparecen, ejecuta esto:

```sql
-- Corregir estado de viajes
UPDATE viajes
SET estado = 'disponible', cupos_disponibles = cupos_total
WHERE conductor_id IN (SELECT id FROM usuarios WHERE nombre ILIKE '%maria%');

-- Corregir modo de María
UPDATE usuarios
SET modo_actual = 'conductor'
WHERE nombre ILIKE '%maria%' AND placa_vehiculo IS NOT NULL;

-- Verificar resultado
SELECT * FROM viajes 
WHERE conductor_id IN (SELECT id FROM usuarios WHERE nombre ILIKE '%maria%');
```

---

## Checklist Final

- [ ] Ejecuté `database/12_corregir_datos_maria.sql`
- [ ] Ejecuté `database/09_fix_rls_y_permisos.sql`
- [ ] Cerré sesión y volví a iniciar como María
- [ ] Abrí la consola (F12) y no hay errores rojos
- [ ] Veo los viajes en "Buscar Viajes" o "Mis Viajes"
- [ ] Los datos se cargan correctamente

---

## Si Aún No Funciona

Proporciona:
1. **Captura de pantalla** de la consola (F12 → Console)
2. **Resultado** de ejecutar `database/10_diagnostico_maria.sql`
3. **Resultado** de ejecutar `database/11_verificar_viajes_estado.sql`
4. **Confirmación** de que ejecutaste los scripts 09 y 12

---

## Cambios Realizados en el Código

✅ **buscar-viajes.html** - Agregué console.log para debugging
✅ **mis-viajes.html** - Agregué console.log y manejo de errores
✅ **mis-solicitudes.html** - Agregué console.log y manejo de errores
✅ **supabaseClient.js** - Agregué función `refrescarPerfil()`
✅ **Todos los archivos** - Ahora refrescan el perfil al cargar

Estos cambios ya están en tu código. Solo necesitas ejecutar los scripts SQL en Supabase.
