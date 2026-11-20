/* =====================================================================
   ISAENMISA · CONTENIDO DE LA WEB
   ---------------------------------------------------------------------
   Este es el ÚNICO archivo que necesitas tocar para cambiar textos,
   fotos, proyectos, vídeos, categorías y datos de contacto.

   Puedes editarlo de dos formas:
   1) Con el editor visual: abre  admin.html  en el navegador.
   2) A mano, con cualquier editor de texto (respeta comillas y comas).

   CONVENCIONES
   - Un texto entre corchetes, p. ej. "[Pendiente: …]", se muestra en la
     web marcado como contenido pendiente. Sustitúyelo por tu texto.
   - Imágenes: { archivo, movil, ancho, alto, alt, pie }
       archivo -> ruta a la foto grande (ej. "img/proyectos/mi-foto.webp")
       movil   -> versión ligera opcional para móvil (ej. "...-900.webp")
       ancho/alto -> tamaño original en píxeles (mantiene la proporción)
       Si "archivo" está vacío se dibuja un MARCADOR DE POSICIÓN.
   - Vídeos: { url, titulo }  -> YouTube, Vimeo o archivo .mp4/.webm
   ===================================================================== */

window.CONTENIDO = {
  "sitio": {
    "nombre": "Isa Cuadros",
    "marca": "ISAENMISA",
    "dominio": "https://isaenmisa.com",
    "tituloSEO": "Isa Cuadros · @isaenmisa — Realización, fotografía y experimentación visual",
    "descripcionSEO": "Archivo visual de Isa Cuadros (@isaenmisa), creadora audiovisual en Granada: realización, fotografía, edición y experimentación visual entre el cine, la cultura alternativa y los eventos.",
    "profesion": "Creadora audiovisual",
    "especialidades": ["Realización", "Fotografía", "Edición", "Experimentación visual"],
    "anio": "2026"
  },

  "inicio": {
    "titular": "El creador con estilo propio es irremplazable",
    "presentacion": "Soy Isa Cuadros, @isaenmisa. Me muevo entre la imagen, el cine y la experimentación visual: conciertos, cultura alternativa, retratos, cortometrajes y piezas que no caben en una sola categoría.",
    "pilares": ["Documental", "Cinematográfico", "Experimental"],
    "cinta": ["Realización", "Fotografía", "Edición", "Experimentación visual", "Cine", "Cultura alternativa", "Eventos"],
    "botonArchivo": "Entrar al archivo visual",
    "imagenPortada": { "archivo": "", "movil": "", "ancho": 1920, "alto": 1080, "alt": "Imagen o fotograma protagonista de la portada", "pie": "[Pendiente: imagen o fotograma protagonista]" },
    "videoPortada": { "url": "", "titulo": "" }
  },

  "sobreMi": {
    "titular": "Sobre mí",
    "entradilla": "Soy Isa Cuadros, @isaenmisa. Me muevo entre la imagen, el cine y la experimentación visual.",
    "retrato": { "archivo": "", "movil": "", "ancho": 1200, "alto": 1500, "alt": "Retrato de Isa Cuadros", "pie": "[Pendiente: retrato · crédito de la foto]" },
    "texto": [
      "Mi trabajo se mueve entre el cine, la cultura alternativa, los eventos y la experimentación artística.",
      "[Pendiente: amplía tu presentación — cómo empezaste, qué te mueve, qué buscas en cada proyecto.]"
    ],
    "pilares": [
      { "nombre": "Documental", "texto": "[Pendiente: qué significa para ti lo documental.]" },
      { "nombre": "Cinematográfico", "texto": "[Pendiente: tu relación con el lenguaje del cine.]" },
      { "nombre": "Experimental", "texto": "[Pendiente: cómo experimentas con la imagen.]" }
    ],
    "formacion": [
      { "anio": "[Año]", "titulo": "[Pendiente: título o curso]", "lugar": "[Centro · ciudad]" },
      { "anio": "[Año]", "titulo": "[Pendiente: título o curso]", "lugar": "[Centro · ciudad]" }
    ],
    "trayectoria": [
      { "anio": "[Año]", "titulo": "[Pendiente: proyecto, encargo o hito]", "detalle": "[Rol · cliente · lugar]" },
      { "anio": "[Año]", "titulo": "[Pendiente: proyecto, encargo o hito]", "detalle": "[Rol · cliente · lugar]" },
      { "anio": "[Año]", "titulo": "[Pendiente: proyecto, encargo o hito]", "detalle": "[Rol · cliente · lugar]" }
    ],
    "intereses": ["[Pendiente: interés o influencia]", "[Pendiente: interés o influencia]", "[Pendiente: interés o influencia]"],
    "filosofia": "[Pendiente: tu filosofía creativa en una o dos frases.]",
    "colaboraciones": ["[Pendiente: colaboración / cliente]", "[Pendiente: colaboración / cliente]"],
    "fotos": [
      { "archivo": "", "movil": "", "ancho": 1600, "alto": 1067, "alt": "", "pie": "[Pendiente: foto de proceso o rodaje]" },
      { "archivo": "", "movil": "", "ancho": 1200, "alto": 1600, "alt": "", "pie": "[Pendiente: foto de proceso o rodaje]" }
    ]
  },

  "categorias": [
    { "id": "events", "nombre": "EVENTS", "descripcion": "Conciertos, festivales, eventos culturales y música.",
      "portada": { "archivo": "", "movil": "", "ancho": 1200, "alto": 1500, "alt": "", "pie": "" } },
    { "id": "photography", "nombre": "PHOTOGRAPHY", "descripcion": "Fotografía documental, retratos y fotografía personal.",
      "portada": { "archivo": "", "movil": "", "ancho": 1200, "alto": 1500, "alt": "", "pie": "" } },
    { "id": "film", "nombre": "FILM", "descripcion": "Cortometrajes, videoclips, piezas audiovisuales y proyectos cinematográficos.",
      "portada": { "archivo": "", "movil": "", "ancho": 1200, "alto": 1500, "alt": "", "pie": "" } },
    { "id": "art-direction", "nombre": "ART DIRECTION", "descripcion": "Dirección de arte, experimentación visual y proyectos creativos.",
      "portada": { "archivo": "", "movil": "", "ancho": 1200, "alto": 1500, "alt": "", "pie": "" } }
  ],

  "proyectos": [
    {
      "id": "proyecto-events-01", "categoria": "events", "destacado": true, "formato": "grande",
      "titulo": "[Título del proyecto]", "fecha": "[Fecha]", "lugar": "[Lugar]", "rol": "[Tu rol]",
      "resumen": "[Pendiente: una línea que resuma el proyecto.]",
      "descripcion": ["[Pendiente: describe el proyecto, el contexto y el enfoque.]"],
      "portada": { "archivo": "", "movil": "", "ancho": 1600, "alto": 1067, "alt": "", "pie": "" },
      "galeria": [
        { "archivo": "", "movil": "", "ancho": 1600, "alto": 1067, "alt": "", "pie": "" },
        { "archivo": "", "movil": "", "ancho": 1200, "alto": 1500, "alt": "", "pie": "" },
        { "archivo": "", "movil": "", "ancho": 1200, "alto": 1500, "alt": "", "pie": "" }
      ],
      "videos": [],
      "creditos": [{ "rol": "[Rol]", "nombre": "[Nombre]" }],
      "enlaces": []
    },
    {
      "id": "proyecto-photography-01", "categoria": "photography", "destacado": true, "formato": "mediano",
      "titulo": "[Título del proyecto]", "fecha": "[Fecha]", "lugar": "[Lugar]", "rol": "[Tu rol]",
      "resumen": "[Pendiente: una línea que resuma el proyecto.]",
      "descripcion": ["[Pendiente: describe el proyecto, el contexto y el enfoque.]"],
      "portada": { "archivo": "", "movil": "", "ancho": 1200, "alto": 1500, "alt": "", "pie": "" },
      "galeria": [
        { "archivo": "", "movil": "", "ancho": 1200, "alto": 1500, "alt": "", "pie": "" },
        { "archivo": "", "movil": "", "ancho": 1200, "alto": 1500, "alt": "", "pie": "" },
        { "archivo": "", "movil": "", "ancho": 1600, "alto": 1067, "alt": "", "pie": "" },
        { "archivo": "", "movil": "", "ancho": 1200, "alto": 1500, "alt": "", "pie": "" }
      ],
      "videos": [],
      "creditos": [{ "rol": "[Rol]", "nombre": "[Nombre]" }],
      "enlaces": []
    },
    {
      "id": "proyecto-film-01", "categoria": "film", "destacado": true, "formato": "ancho",
      "titulo": "[Título del proyecto]", "fecha": "[Fecha]", "lugar": "[Lugar]", "rol": "[Tu rol]",
      "resumen": "[Pendiente: una línea que resuma el proyecto.]",
      "descripcion": ["[Pendiente: sinopsis, formato, duración y contexto de la pieza.]"],
      "portada": { "archivo": "", "movil": "", "ancho": 1920, "alto": 817, "alt": "", "pie": "" },
      "galeria": [
        { "archivo": "", "movil": "", "ancho": 1920, "alto": 817, "alt": "", "pie": "[Fotograma]" },
        { "archivo": "", "movil": "", "ancho": 1920, "alto": 817, "alt": "", "pie": "[Fotograma]" }
      ],
      "videos": [{ "url": "", "titulo": "[Pendiente: enlace de YouTube o Vimeo]" }],
      "creditos": [{ "rol": "Dirección", "nombre": "[Nombre]" }, { "rol": "[Rol]", "nombre": "[Nombre]" }],
      "enlaces": []
    },
    {
      "id": "proyecto-art-direction-01", "categoria": "art-direction", "destacado": false, "formato": "mediano",
      "titulo": "[Título del proyecto]", "fecha": "[Fecha]", "lugar": "[Lugar]", "rol": "[Tu rol]",
      "resumen": "[Pendiente: una línea que resuma el proyecto.]",
      "descripcion": ["[Pendiente: describe el concepto y el proceso.]"],
      "portada": { "archivo": "", "movil": "", "ancho": 1200, "alto": 1200, "alt": "", "pie": "" },
      "galeria": [
        { "archivo": "", "movil": "", "ancho": 1200, "alto": 1200, "alt": "", "pie": "" },
        { "archivo": "", "movil": "", "ancho": 1200, "alto": 1500, "alt": "", "pie": "" }
      ],
      "videos": [],
      "creditos": [{ "rol": "[Rol]", "nombre": "[Nombre]" }],
      "enlaces": []
    },
    {
      "id": "proyecto-events-02", "categoria": "events", "destacado": false, "formato": "pequeno",
      "titulo": "[Título del proyecto]", "fecha": "[Fecha]", "lugar": "[Lugar]", "rol": "[Tu rol]",
      "resumen": "[Pendiente: una línea que resuma el proyecto.]",
      "descripcion": ["[Pendiente: describe el proyecto.]"],
      "portada": { "archivo": "", "movil": "", "ancho": 1200, "alto": 1500, "alt": "", "pie": "" },
      "galeria": [
        { "archivo": "", "movil": "", "ancho": 1200, "alto": 1500, "alt": "", "pie": "" },
        { "archivo": "", "movil": "", "ancho": 1600, "alto": 1067, "alt": "", "pie": "" }
      ],
      "videos": [],
      "creditos": [{ "rol": "[Rol]", "nombre": "[Nombre]" }],
      "enlaces": []
    },
    {
      "id": "proyecto-photography-02", "categoria": "photography", "destacado": false, "formato": "pequeno",
      "titulo": "[Título del proyecto]", "fecha": "[Fecha]", "lugar": "[Lugar]", "rol": "[Tu rol]",
      "resumen": "[Pendiente: una línea que resuma el proyecto.]",
      "descripcion": ["[Pendiente: describe el proyecto.]"],
      "portada": { "archivo": "", "movil": "", "ancho": 1600, "alto": 1067, "alt": "", "pie": "" },
      "galeria": [
        { "archivo": "", "movil": "", "ancho": 1600, "alto": 1067, "alt": "", "pie": "" },
        { "archivo": "", "movil": "", "ancho": 1200, "alto": 1500, "alt": "", "pie": "" }
      ],
      "videos": [],
      "creditos": [{ "rol": "[Rol]", "nombre": "[Nombre]" }],
      "enlaces": []
    },
    {
      "id": "proyecto-film-02", "categoria": "film", "destacado": false, "formato": "mediano",
      "titulo": "[Título del proyecto]", "fecha": "[Fecha]", "lugar": "[Lugar]", "rol": "[Tu rol]",
      "resumen": "[Pendiente: videoclip, pieza o cortometraje.]",
      "descripcion": ["[Pendiente: describe la pieza.]"],
      "portada": { "archivo": "", "movil": "", "ancho": 1920, "alto": 1080, "alt": "", "pie": "" },
      "galeria": [
        { "archivo": "", "movil": "", "ancho": 1920, "alto": 1080, "alt": "", "pie": "[Fotograma]" }
      ],
      "videos": [{ "url": "", "titulo": "[Pendiente: enlace de YouTube o Vimeo]" }],
      "creditos": [{ "rol": "[Rol]", "nombre": "[Nombre]" }],
      "enlaces": []
    },
    {
      "id": "proyecto-art-direction-02", "categoria": "art-direction", "destacado": false, "formato": "pequeno",
      "titulo": "[Título del proyecto]", "fecha": "[Fecha]", "lugar": "[Lugar]", "rol": "[Tu rol]",
      "resumen": "[Pendiente: una línea que resuma el proyecto.]",
      "descripcion": ["[Pendiente: describe el concepto y el proceso.]"],
      "portada": { "archivo": "", "movil": "", "ancho": 1200, "alto": 1500, "alt": "", "pie": "" },
      "galeria": [
        { "archivo": "", "movil": "", "ancho": 1200, "alto": 1500, "alt": "", "pie": "" }
      ],
      "videos": [],
      "creditos": [{ "rol": "[Rol]", "nombre": "[Nombre]" }],
      "enlaces": []
    }
  ],

  "contacto": {
    "titular": "Hablemos",
    "bienvenida": "Si tienes una historia que contar, un concierto que documentar o una idea rara que nadie entiende todavía, escríbeme. Me interesa.",
    "email": "hola@isaenmisa.com",
    "telefono": "+34 722 190 020",
    "instagram": "isaenmisa",
    "ubicacion": "Granada, España",
    "vimeo": "",
    "youtube": "",
    "formulario": {
      "endpoint": "",
      "tipos": ["Evento o concierto", "Fotografía", "Vídeo / film", "Dirección de arte", "Colaboración artística", "Otro"]
    }
  }
};
