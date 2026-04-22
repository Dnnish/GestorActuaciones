# Sugerencias de mejora — MiniDrive

## Funcionalidad

### 1. Buscador en PETs
Actualmente las actuaciones tienen buscador con debounce y trigram, pero las carpetas PET no. A medida que crezcan las carpetas, encontrar una especifica sera dificil.

### 2. Confirmacion antes de subir archivos grandes
No hay limite visible ni confirmacion cuando se suben archivos pesados. Mostrar el progreso de subida y permitir cancelar evitaria subidas accidentales de archivos grandes.

### 3. Ordenamiento y filtros en listados
Las actuaciones solo se pueden buscar por nombre. Poder ordenar por fecha, por estado de Coliseo (pendientes primero), o filtrar por creador seria util para equipos grandes.

### 4. Historial de actividad / audit log
No hay registro de quien hizo que. Un log basico (quien subio, elimino, renombro, cambio coliseo) daria trazabilidad sin complejidad excesiva.

### 5. Notificaciones en tiempo real
Cuando un admin marca algo como subido a Coliseo o sube documentos, otros usuarios no se enteran hasta que refrescan. WebSockets o polling periodico resolveria esto.

### 6. Vista previa de PDF en PETs
Los PETs solo muestran preview de imagenes. Si en algun momento se necesitan otros formatos, el visor de PDF ya existe en documentos y se podria reutilizar.

### 7. Papelera de reciclaje
Los documentos y carpetas eliminados se pierden permanentemente. Una papelera con retencion de 30 dias (soft delete a nivel de documento) permitiria recuperar borrados accidentales.

## Seguridad

### 8. Rate limiting en login
No hay proteccion contra fuerza bruta en el endpoint de login. Con codigos numericos de 10 digitos, un rate limiter (ej: 5 intentos por minuto por IP) es importante.

### 9. Validacion de tamano de archivo en backend
El frontend muestra errores de formato pero el backend solo valida MIME type. Establecer un limite maximo por archivo (ej: 50MB) y por carpeta evitaria llenar el storage.

### 10. Politica de contrasenas mas robusta
Actualmente el minimo es 8 caracteres sin restricciones. Requerir al menos un numero y una letra mejoraria la seguridad sin ser excesivo.

### 11. Sesiones con expiracion visible
El usuario no sabe cuando va a expirar su sesion. Un aviso de "tu sesion expira en 5 minutos" con opcion de extender mejoraria la UX.

## UX / UI

### 12. Drag & drop para reordenar
No se puede cambiar el orden de documentos dentro de una carpeta. Drag and drop para priorizar o reorganizar seria una mejora natural.

### 13. Vista de cuadricula para imagenes
Las imagenes en PETs y en la carpeta "fotos" se muestran como lista de texto. Una vista de thumbnails/cuadricula permitiria identificar imagenes visualmente.

### 14. Breadcrumbs en navegacion
La pagina de detalle de actuacion solo tiene un boton "Volver". Breadcrumbs (Actuaciones > Nombre de actuacion > Carpeta) darian mejor contexto de ubicacion.

### 15. Skeleton loading consistente
Algunas paginas tienen skeletons y otras no. Estandarizar el patron de carga para toda la app.

### 16. Feedback tactil en movil
Los botones de accion (eliminar, descargar, coliseo) son pequenos en movil. Aumentar el area tactil minima a 44x44px siguiendo las guias de accesibilidad.

## Tecnico

### 17. Tests E2E
Solo hay tests unitarios y de integracion. Tests E2E con Playwright para los flujos criticos (login, subir documento, descargar ZIP) darian confianza para deployar.

### 18. Compresion de imagenes al subir
Las imagenes en "fotos" se guardan tal cual. Comprimir/redimensionar automaticamente (como ya se hace con PETs via Sharp) reduciria el uso de storage.

### 19. Cache de queries mas agresivo
Muchas queries de TanStack Query tienen `staleTime` por defecto (0). Para datos que cambian poco (lista de usuarios, actuaciones), un staleTime de 30-60s reduciria peticiones.

### 20. Migracion del superadmin existente en seed
El seed no maneja la migracion de `admin@minidrive.com` a `0000000000@minidrive.com`. Si alguien ejecuta el seed en una BD existente, el admin viejo sigue con el formato antiguo. El seed deberia detectar y migrar automaticamente.
