# ISAENMISA · Web de Isa Cuadros

Web estática (HTML, CSS y JavaScript sin dependencias externas). Funciona en cualquier alojamiento: Netlify, Vercel, GitHub Pages, Hostinger, un FTP…

## Estructura

```
index.html              La web (portada, sobre mí, archivo, proyectos, contacto)
admin.html              Editor de contenido (no se indexa en buscadores)
contenido/contenido.js  ← TODO el contenido: textos, fotos, proyectos, vídeos, contacto
img/                    Tus fotos (proyectos/, sobre-mi/, portada/, categorias/)
assets/marca/           Logotipos, favicon e imagen para redes sociales
assets/graficos/        Recursos gráficos propios (garabato azul)
assets/fuentes/         Tipografías (Anton, DM Sans, Anonymous Pro · licencia OFL)
css/estilos.css         Diseño de la web
js/app.js               Funcionamiento de la web
css/admin.css, js/admin.js   Editor
```

## Cómo editar el contenido

### Opción A · Editor visual (recomendado)
1. Abre `admin.html` en Chrome o Edge (en tu web publicada, o en local; ver abajo).
2. Edita textos, sube fotos (se optimizan solas a WebP, con versión ligera para móvil), añade proyectos, vídeos y créditos, y reordena arrastrando.
3. Pulsa **Vista previa** para ver la web real con tus cambios.
4. Pulsa **Exportar cambios** y elige:
   - **Guardar en la carpeta de la web** (Chrome/Edge en ordenador): escribe los archivos directamente.
   - **Descargar .zip**: descomprímelo encima de la carpeta de la web.
   - **Descargar contenido.js**: si solo cambiaste textos.
5. Sube la carpeta actualizada a tu alojamiento.

Los cambios se guardan automáticamente como borrador **en ese navegador** hasta que exportas. El editor no puede modificar la web publicada por sí solo, así que no supone un riesgo tenerlo subido.

### Opción B · A mano
Abre `contenido/contenido.js` con cualquier editor de texto. Cada bloque está comentado. Para una foto nueva: cópiala en `img/…` y escribe su ruta en `"archivo"` con su `"ancho"` y `"alto"` en píxeles.

## Convenciones
- Textos entre corchetes, como `"[Pendiente: …]"`, se muestran en la web marcados como pendientes (en azul, con borde discontinuo). Sustitúyelos por tu contenido.
- Una imagen con `"archivo": ""` se dibuja como **marcador de posición** con su proporción.
- Las imágenes conservan siempre su proporción original (no se recortan).
- Vídeos: pega un enlace de YouTube o Vimeo, o la ruta de un `.mp4`. Nunca se reproducen solos: se cargan al pulsar.
- La numeración 001, 002… de los proyectos sigue el orden de la lista.

## Formulario de contacto
Por defecto abre la aplicación de correo del visitante con el mensaje preparado para `hola@isaenmisa.com`.
Para recibir los mensajes directamente, crea un formulario gratuito en Formspree (o similar) y pega su dirección en *Editor → Contacto → Dirección de envío*.

## Probar en tu ordenador
Haz doble clic en `index.html`, o mejor, desde la carpeta de la web:
```
python3 -m http.server 8000
```
y abre http://localhost:8000 (la vista previa del editor funciona mejor así).

## Dominio
La web asume `https://isaenmisa.com`. Si usas otro dominio, cámbialo en `index.html` (canonical, og:image), `robots.txt` y `sitemap.xml`.
