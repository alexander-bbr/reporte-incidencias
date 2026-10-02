# Documentación del Proyecto

## Tablas

### Tablas Principales

- usuario
- auditoria
- reporte
- equipo
- fallas
- observaciones

### Tablas intermedias

- reporte_falla
- reporte_equipo

### Relaciones

- usuario -> reporte (1:N)
- usuario -> equipo (1:N)
- usuario -> auditoria (1:N)
- usuario -> observacion (1:N)
- reporte -> equipo (n:m)
- reporte -> falla (n:m)

## Roles y Sus Permisos

1. Sistemas
   - Reportes: No puede Agregar ni Eliminar Reportes, solo Editar, pero solo puede editar el campo solución y estado. El resto de campos no los puede editar sistemas (si acaso deberían de estar con readonly unicamente para que pueda ver que tiene escrito esos campos).
   - Equipos (TODO)
   - Fallas (TODO)
   - Observaciones (TODO)

1. Coordinadora
   - Reportes (TODO, menos editar los campos de Solución y estado, si acaso verlos, o sea con readonly)
   - Equipos (TODO)
   - Fallas (TODO)
   - Observaciones (TODO)
   - Usuarios (TODO)
   - Auditoria (Ver)

1. Admisionista
   - Reportes (TODO, menos editar los campos de Solución y estado, si acaso verlos, o sea con readonly)
   - Equipos (TODO)
   - Fallas (TODO)
   - Observaciones (TODO)

## Módulos

- Reportes
  - Ver
  - Agregar
  - Editar (Editar los datos generales o el Estado y la Solución)
  - Eliminar

- Equipos
  - Ver
  - Agregar
  - Editar
  - Eliminar

- Fallas
  - Ver
  - Agregar
  - Editar
  - Eliminar

- Observaciones
  - Ver
  - Agregar
  - Editar
  - Eliminar

- Usuarios
  - Ver
  - Agregar
  - Editar
  - Eliminar

- Auditoria
  - Ver

- Sign In
  - Solo Iniciar Sesión, es la Coordinadora quien registra los usuarios

## Aclaraciones

- En el frontend, los registros se están ordenando de forma alfabética.
