# Backend - Sistema de Gestión de Gimnasio

## Scripts

- **`npm start`** — Inicia el servidor.
- **`npm run dev`** — Inicia con nodemon.
- **`npm run clear:data`** — Limpia todos los datos de la base (reservas, pagos, socios, usuarios, clases, etc.) sin tocar el esquema ni las tablas de cuantificación (`configuracion_gym`, `planes`, `socio_estado`, `tipo_clase`, `tipo_rutina`, `estado_ejercicios`).
- **`npm run seed`** — Genera datos de prueba. Ejecutar después de `clear:data` si la base ya tenía datos.

## Datos de prueba (seeds)

Tras ejecutar `npm run seed`:

1. **Limpiar y regenerar:** `npm run clear:data` y luego `npm run seed`.

2. **Correos y contraseñas (dominio @gym.com):**

   | Rol         | Email              | Contraseña   |
   |------------|---------------------|--------------|
   | Root       | root@gym.com        | root123      |
   | Admin      | admin1@gym.com, admin2@gym.com, admin3@gym.com | admin123  |
   | Instructor | instructor1@gym.com … instructor12@gym.com     | instructor123 |
   | Socio      | socio1@gym.com … socio200@gym.com              | socio123   |

3. **Cantidades aproximadas:** 1 root, 3 admins, 12 instructores (≥3 inactivos), 200+ socios, 10 tipos de clase, varias clases y pagos/accesos/reservas entre 2023 y 2026.

4. **Pregunta de seguridad:** Para recuperación de contraseña, respuesta por defecto en seeds: `test`.

5. **Planes:** La tabla `planes` no se borra ni se modifica. Para que se generen pagos, debe haber al menos un plan en la base (p. ej. insertado manualmente o dejado por una ejecución anterior). Si no hay planes, los socios quedan sin `plan_id` y no se crean registros en `pagos`.
