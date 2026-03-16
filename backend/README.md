# Backend - Sistema de Gestión de Gimnasio

## Scripts

- **`npm start`** — Inicia el servidor.
- **`npm run dev`** — Inicia con nodemon.
- **`npm run clear:data`** — Limpia todos los datos de la base (reservas, pagos, socios, usuarios, clases, etc.) sin tocar el esquema ni las tablas de cuantificación (`configuracion_gym`, `planes`, `socio_estado`, `tipo_clase`, `tipo_rutina`, `estado_ejercicios`).
- **`npm run seed`** — Genera datos de prueba. Ejecutar después de `clear:data` si la base ya tenía datos.

## Datos de prueba (seeds)

Tras ejecutar `npm run seed`:

1. **Limpiar y regenerar:** `npm run clear:data` y luego `npm run seed`.

2. **Seed determinista (DATA_SEED):** En el archivo `.env` del backend puedes definir la variable `DATA_SEED` (por ejemplo `DATA_SEED=12345`). Si dos máquinas usan el mismo valor y ejecutan `npm run seed`, se generan exactamente los mismos datos de prueba. Al ejecutar el seed, en consola se muestra el valor usado (ej. `Seed actual: 12345`). Si no defines `DATA_SEED`, los datos serán no deterministas (cada ejecución puede variar).

3. **Fechas:** Todas las fechas generadas (clases, pagos, accesos, socios, reservas) están acotadas entre 2023 y la **fecha actual**; no se generan datos con fecha futura.

4. **Correos y contraseñas (dominio @gym.com):**

   | Rol         | Email              | Contraseña   |
   |------------|---------------------|--------------|
   | Root       | root@gym.com        | root123      |
   | Admin      | admin1@gym.com, admin2@gym.com, admin3@gym.com | admin123  |
   | Instructor | instructor1@gym.com … instructor12@gym.com     | instructor123 |
   | Socio      | socio1@gym.com … socio200@gym.com              | socio123   |

5. **Cantidades aproximadas:** 1 root, 3 admins, 12 instructores (≥3 inactivos), 200+ socios, 10 tipos de clase, varias clases y pagos/accesos/reservas (fechas hasta hoy).

6. **Preguntas de seguridad:** Cada usuario recibe **una de 5 preguntas asignada al azar** (ciudad de nacimiento, equipo de fútbol preferido, película favorita, escuela primaria, primer auto). La respuesta válida en seeds es la **palabra plana** asociada: `ciudad`, `equipo`, `pelicula`, `escuela` o `auto`, según la pregunta que se haya asignado.

7. **Notas en socios:** Aproximadamente un 35 % de los socios se crean con una nota aleatoria (detalles como preferencia de horario, alergias, renovación de carnet, etc.); el resto queda sin notas.

8. **Planes:** La tabla `planes` no se borra ni se modifica. Para que se generen pagos, debe haber al menos un plan en la base (p. ej. insertado manualmente o dejado por una ejecución anterior). Si no hay planes, los socios quedan sin `plan_id` y no se crean registros en `pagos`.
