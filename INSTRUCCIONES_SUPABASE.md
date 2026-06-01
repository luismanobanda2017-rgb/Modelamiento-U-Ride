# Instrucciones Paso a Paso para Ejecutar Scripts en Supabase

## Acceso a Supabase

1. Abre tu navegador
2. Ve a: https://supabase.com/dashboard/project/qwszgjivoknjhhswiatz/editor
3. Deberías ver el SQL Editor

---

## Paso 1: Ejecutar Script de Corrección (IMPORTANTE)

### 1.1 Crear Nueva Query
- En el panel izquierdo, haz clic en **"SQL Editor"**
- En la parte superior derecha, haz clic en **"+ New Query"**

### 1.2 Copiar el Script
- Abre el archivo: `database/12_corregir_datos_maria.sql`
- Selecciona TODO el contenido (Ctrl+A)
- Copia (Ctrl+C)

### 1.3 Pegar en Supabase
- En la ventana del editor SQL de Supabase, pega (Ctrl+V)
- Deberías ver el código SQL en la ventana

### 1.4 Ejecutar
- Haz clic en el botón **"Run"** (o presiona Ctrl+Enter)
- Espera a que termine (verás un checkmark verde)

### 1.5 Revisar Resultados
- En la parte inferior, verás los resultados
- Busca la sección "Verificar resultado"
- Deberías ver a María González con sus datos

---

## Paso 2: Ejecutar Script de RLS y Permisos

### 2.1 Crear Nueva Query
- Haz clic en **"+ New Query"** nuevamente

### 2.2 Copiar el Script
- Abre el archivo: `database/09_fix_rls_y_permisos.sql`
- Selecciona TODO el contenido (Ctrl+A)
- Copia (Ctrl+C)

### 2.3 Pegar en Supabase
- En la ventana del editor SQL, pega (Ctrl+V)

### 2.4 Ejecutar
- Haz clic en **"Run"** (o presiona Ctrl+Enter)
- Espera a que termine

### 2.5 Revisar Resultados
- En la parte inferior, verás un conteo de registros
- Deberías ver algo como:
  ```
  tabla        | total
  -------------|-------
  usuarios     | 5
  viajes       | 12
  solicitudes  | 8
  ```

---

## Paso 3: Prueba en la App

### 3.1 Abre la App
- Abre tu navegador
- Ve a tu app (ej: https://luismanobanda2017-rgb.github.io/Modelamiento-U-Ride/src/Web_Visual/index.html)

### 3.2 Cierra Sesión (si estás dentro)
- Haz clic en "Cerrar Sesión"

### 3.3 Inicia Sesión como María
- Email: maria@uta.edu.ec (o el que uses)
- Contraseña: (la que uses)
- Haz clic en "Iniciar Sesión"

### 3.4 Abre la Consola
- Presiona **F12** en tu teclado
- Deberías ver la consola del navegador
- Ve a la pestaña **"Console"**

### 3.5 Navega a "Buscar Viajes"
- En la app, haz clic en "Buscar Viajes"
- En la consola, deberías ver:
  ```
  Buscando viajes con filtros: {}
  Viajes encontrados: [...]
  ```

### 3.6 Revisa los Resultados
- Si ves viajes en la consola, ¡está funcionando!
- Si ves un error rojo, copia el error y proporciona la información

---

## Si Algo Sale Mal

### Error: "Permission denied"
**Solución:** Ejecuta nuevamente `database/09_fix_rls_y_permisos.sql`

### Error: "Relation does not exist"
**Solución:** Verifica que ejecutaste `database/01_tablas.sql` primero

### No ves viajes en la consola
**Solución:** 
1. Ejecuta `database/11_verificar_viajes_estado.sql`
2. Revisa si hay viajes en la base de datos
3. Revisa si los viajes tienen `estado = 'disponible'`

### María no aparece en los resultados
**Solución:**
1. Ejecuta `database/10_diagnostico_maria.sql`
2. Revisa si María existe en la base de datos
3. Verifica su ID y datos

---

## Checklist de Ejecución

- [ ] Ejecuté `database/12_corregir_datos_maria.sql`
- [ ] Vi los resultados sin errores
- [ ] Ejecuté `database/09_fix_rls_y_permisos.sql`
- [ ] Vi el conteo de registros
- [ ] Cerré sesión en la app
- [ ] Inicié sesión como María
- [ ] Abrí la consola (F12)
- [ ] Fui a "Buscar Viajes"
- [ ] Vi los console.log en la consola
- [ ] Los viajes aparecen en la app

---

## Información Importante

### URLs Importantes
- **Supabase SQL Editor:** https://supabase.com/dashboard/project/qwszgjivoknjhhswiatz/editor
- **Tu App:** https://luismanobanda2017-rgb.github.io/Modelamiento-U-Ride/src/Web_Visual/index.html

### Archivos Importantes
- `database/09_fix_rls_y_permisos.sql` - Reaplica RLS y permisos
- `database/10_diagnostico_maria.sql` - Diagnostica a María
- `database/11_verificar_viajes_estado.sql` - Verifica estado de viajes
- `database/12_corregir_datos_maria.sql` - Corrige datos de María

### Teclas Útiles
- **F12** - Abre la consola del navegador
- **Ctrl+A** - Selecciona todo
- **Ctrl+C** - Copia
- **Ctrl+V** - Pega
- **Ctrl+Enter** - Ejecuta query en Supabase

---

## Próximos Pasos

1. ✅ Ejecuta los scripts SQL
2. ✅ Prueba en la app
3. ✅ Abre la consola y revisa los logs
4. ✅ Si funciona, ¡listo!
5. ❓ Si no funciona, proporciona los logs de la consola

¡Éxito! 🚀
