# PROYECTA-IA — Título y Objetivo General

Módulo web para comprobar la correspondencia entre el **Objetivo General** y el **Título** de un Proyecto de Grado.

## Regla metodológica implementada

El título correcto se obtiene eliminando **únicamente el verbo inicial en infinitivo** del Objetivo General.

Ejemplo:

Objetivo general:
`Desarrollar un sistema con visión artificial para...`

Título:
`Sistema con visión artificial para...`

La aplicación:
- detecta el verbo inicial;
- verifica si parece estar en infinitivo;
- construye el título esperado;
- compara el título escrito por el estudiante;
- identifica palabras faltantes o sobrantes;
- informa si coincide, coincide parcialmente o no coincide.

## Archivos

- `index.html`
- `styles.css`
- `app.js`
- `README.md`

## Publicar en GitHub Pages

1. Crea un repositorio nuevo, por ejemplo:
   `proyecta-ia-titulo-objetivo`

2. Sube los cuatro archivos a la raíz.

3. Ve a:
   `Settings` → `Pages`

4. Selecciona:
   - `Deploy from a branch`
   - Rama `main`
   - Carpeta `/ (root)`

5. Guarda.

La URL tendrá una forma parecida a:

`https://TU-USUARIO.github.io/proyecta-ia-titulo-objetivo/`

## Diseño pedagógico

Este módulo no redacta el objetivo general por el estudiante. Solo verifica si el título corresponde a lo que el estudiante ya formuló.


## Control de acceso por C.I.

Esta versión incorpora una pantalla de acceso para el paralelo 9A.

- Los C.I. autorizados provienen de la nómina entregada por el docente.
- El docente puede ingresar con su código definido.
- Los números de C.I. NO están escritos en texto plano dentro de `access.js`.
- El navegador deriva localmente una huella PBKDF2-SHA256 y la compara con una lista de huellas autorizadas.
- La sesión se conserva únicamente mientras permanece abierta la sesión del navegador (`sessionStorage`).

### Advertencia importante

GitHub Pages es un servicio de páginas estáticas y públicas. Por tanto, este control funciona como una
barrera de acceso para uso de clase, pero no constituye autenticación de alta seguridad: una persona con
conocimientos técnicos podría inspeccionar/modificar el código del navegador.

No publiques en GitHub la lista original de estudiantes ni sus C.I. en texto plano.

Si más adelante se requiere acceso realmente privado, conviene migrar la autenticación a un backend,
servicio de identidad o plataforma institucional.
