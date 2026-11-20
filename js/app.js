/* =====================================================================
   ISAENMISA · LÓGICA DE LA WEB
   Lee el contenido de window.CONTENIDO (contenido/contenido.js) y pinta
   las páginas. No hace falta tocar este archivo para cambiar contenido.
   ===================================================================== */
(function () {
  "use strict";

  var C = window.CONTENIDO;
  var principal = document.getElementById("principal");
  var imagenesBorrador = {};           // ruta -> URL temporal (solo en vista previa)
  var galerias = {};                   // grupo -> [imágenes] para el visor
  var reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
     Utilidades
     ------------------------------------------------------------------ */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function esPendiente(s) { return typeof s === "string" && /^\s*\[[\s\S]*\]\s*$/.test(s); }
  // Texto con marca visual si está pendiente ("[Pendiente: …]")
  function t(s) {
    if (s == null || s === "") return "";
    return esPendiente(s) ? '<span class="pendiente">' + esc(s) + "</span>" : esc(s);
  }
  function lleno(s) { return s != null && String(s).trim() !== ""; }
  function num(n) { return String(n).padStart(3, "0"); }
  function lista(a) { return Array.isArray(a) ? a : []; }
  function ruta(p) { return imagenesBorrador[p] || p; }
  function categoria(id) {
    return lista(C.categorias).filter(function (c) { return c.id === id; })[0] || { id: id, nombre: String(id || "").toUpperCase(), descripcion: "" };
  }
  function indiceProyecto(p) { return lista(C.proyectos).indexOf(p) + 1; }
  function icono(id, cls) { return '<svg class="icono ' + (cls || "") + '" aria-hidden="true" focusable="false"><use href="#' + id + '"/></svg>'; }
  function avisar(msg) {
    var a = document.getElementById("aviso");
    a.textContent = msg; a.classList.add("visible");
    clearTimeout(avisar._t); avisar._t = setTimeout(function () { a.classList.remove("visible"); }, 2600);
  }

  /* ------------------------------------------------------------------
     Recursos gráficos propios (sprite SVG reutilizable)
     ------------------------------------------------------------------ */
  function estrellaPuntos(n, rExt, rInt, cx, cy) {
    var p = [];
    for (var i = 0; i < n * 2; i++) {
      var r = i % 2 ? rInt : rExt, a = Math.PI * i / n - Math.PI / 2;
      p.push((cx + r * Math.cos(a)).toFixed(1) + "," + (cy + r * Math.sin(a)).toFixed(1));
    }
    return p.join(" ");
  }
  var sprite =
    '<svg xmlns="http://www.w3.org/2000/svg" style="display:none">' +
    '<symbol id="i-estrella" viewBox="0 0 100 100"><polygon points="' + estrellaPuntos(12, 50, 27, 50, 50) + '"/></symbol>' +
    '<symbol id="i-estrella-play" viewBox="0 0 100 100"><polygon points="' + estrellaPuntos(12, 50, 33, 50, 50) + '"/><polygon points="41,34 41,66 68,50" fill="#0047AB"/></symbol>' +
    '<symbol id="i-flecha" viewBox="0 0 48 24"><path d="M2 13c9-1 20-3 40-1M33 4c4 3 7 6 11 8-4 2-8 5-11 9" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></symbol>' +
    '<symbol id="i-flecha-diag" viewBox="0 0 24 24"><path d="M5 19C10 14 13 10 18 6M9 5.5c3-.3 6-.4 9.5.1.4 3.4.3 6.6 0 9.6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></symbol>' +
    "</svg>";
  document.body.insertAdjacentHTML("afterbegin", sprite);

  // Trazo a mano alzada (círculo o subrayado) para marcar palabras
  function trazoCirculo() {
    return '<svg viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M150 9C114 1 46 3 18 22 -4 37 9 63 58 72c46 8 112 3 132-20 15-18-7-38-58-44-30-3-60-1-82 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>';
  }

  /* ------------------------------------------------------------------
     Medios: imágenes reales o marcadores de posición
     ------------------------------------------------------------------ */
  function marcador(img, etiqueta) {
    var w = +img.ancho || 1600, h = +img.alto || 1000, fs = Math.max(w, h) * 0.024, m = w * 0.035;
    var proporcion = (function () {
      function mcd(a, b) { return b ? mcd(b, a % b) : a; }
      var d = mcd(w, h); var a = w / d, b = h / d;
      return a > 40 ? (w / h).toFixed(2) + ":1" : a + ":" + b;
    })();
    return '<svg class="marcador" viewBox="0 0 ' + w + " " + h + '" role="img" aria-label="Marcador de posición: sustituir por fotografía (' + proporcion + ')" preserveAspectRatio="xMidYMid meet">' +
      '<rect width="100%" height="100%" fill="#F7F5EF"/>' +
      '<path d="M0 0L' + w + " " + h + "M" + w + " 0L0 " + h + '" stroke="currentColor" stroke-width="' + fs * 0.06 + '" opacity=".35"/>' +
      '<rect x="' + m + '" y="' + m + '" width="' + (w - 2 * m) + '" height="' + (h - 2 * m) + '" fill="none" stroke="currentColor" stroke-width="' + fs * 0.08 + '" stroke-dasharray="' + fs * 0.5 + " " + fs * 0.35 + '"/>' +
      '<rect x="' + (w / 2 - fs * 7.5) + '" y="' + (h / 2 - fs * 2.6) + '" width="' + fs * 15 + '" height="' + fs * 5.2 + '" fill="#F7F5EF" stroke="currentColor" stroke-width="' + fs * 0.08 + '"/>' +
      '<text x="50%" y="' + (h / 2 - fs * 0.9) + '" text-anchor="middle" font-size="' + fs * 0.95 + '" font-weight="700">MARCADOR DE POSICIÓN</text>' +
      '<text x="50%" y="' + (h / 2 + fs * 0.45) + '" text-anchor="middle" font-size="' + fs * 0.75 + '">' + esc(etiqueta || "Sustituir por fotografía") + "</text>" +
      '<text x="50%" y="' + (h / 2 + fs * 1.65) + '" text-anchor="middle" font-size="' + fs * 0.7 + '">' + proporcion + " · " + w + "×" + h + " PX</text>" +
      "</svg>";
  }
  function imagenHTML(img, opciones) {
    opciones = opciones || {};
    img = img || {};
    if (!lleno(img.archivo)) return marcador(img, opciones.etiqueta);
    var src = ruta(img.archivo), srcset = "";
    if (lleno(img.movil)) srcset = ' srcset="' + esc(ruta(img.movil)) + " 900w, " + esc(src) + " " + (+img.ancho || 2000) + 'w" sizes="' + (opciones.sizes || "(max-width: 760px) 100vw, 60vw") + '"';
    var dims = img.ancho && img.alto ? ' width="' + +img.ancho + '" height="' + +img.alto + '"' : "";
    var carga = opciones.prioridad ? ' fetchpriority="high"' : ' loading="lazy"';
    return '<img src="' + esc(src) + '"' + srcset + dims + ' alt="' + esc(img.alt || "") + '"' + carga + ' decoding="async">';
  }
  function medio(img, opciones) {
    opciones = opciones || {};
    var pie = opciones.pie !== false && lleno(img && img.pie) ? "<figcaption>" + (opciones.prefijo || "") + t(img.pie) + "</figcaption>" : "";
    var interior = imagenHTML(img, opciones);
    if (opciones.grupo) {
      galerias[opciones.grupo] = galerias[opciones.grupo] || [];
      var i = galerias[opciones.grupo].push(img) - 1;
      interior = '<button class="medio--boton" type="button" data-visor="' + esc(opciones.grupo) + '" data-indice="' + i + '" aria-label="Ampliar imagen ' + (i + 1) + '">' + interior + "</button>";
    }
    return '<figure class="medio"' + (opciones.revelar === false ? "" : " data-revelar") + ">" + interior + pie + "</figure>";
  }

  /* ------------------------------------------------------------------
     Vídeo: YouTube, Vimeo o archivo propio. Nunca se reproduce solo.
     ------------------------------------------------------------------ */
  function analizarVideo(url) {
    if (!lleno(url)) return null;
    var m;
    if ((m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/)))
      return { tipo: "youtube", src: "https://www.youtube-nocookie.com/embed/" + m[1] + "?autoplay=1&rel=0&modestbranding=1" };
    if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/(\w+))?/)))
      return { tipo: "vimeo", src: "https://player.vimeo.com/video/" + m[1] + "?autoplay=1&dnt=1" + (m[2] ? "&h=" + m[2] : "") };
    if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)) return { tipo: "archivo", src: url };
    return { tipo: "enlace", src: url };
  }
  function videoHTML(v) {
    v = v || {};
    var info = analizarVideo(v.url), titulo = lleno(v.titulo) ? v.titulo : "Vídeo";
    var tituloHTML = lleno(v.titulo) ? '<p class="video-titulo">' + t(v.titulo) + "</p>" : "";
    if (!info) return '<div data-revelar><div class="video video--vacio"><div>' + icono("i-estrella", "") + "<p>Marcador de posición · vídeo<br>Añade un enlace de YouTube, Vimeo o un archivo .mp4</p></div></div>" + tituloHTML + "</div>";
    if (info.tipo === "archivo")
      return '<div data-revelar><div class="video"><video controls preload="metadata" playsinline src="' + esc(ruta(info.src)) + '"></video></div>' + tituloHTML + "</div>";
    if (info.tipo === "enlace")
      return '<div data-revelar><a class="boton" href="' + esc(info.src) + '" target="_blank" rel="noopener">Ver vídeo ' + icono("i-flecha-diag") + "</a>" + tituloHTML + "</div>";
    return '<div data-revelar><div class="video"><button class="video__boton" type="button" data-video="' + esc(info.src) + '" data-titulo="' + esc(esPendiente(titulo) ? "Vídeo" : titulo) + '">' +
      icono("i-estrella-play") + "<span>Reproducir vídeo</span><small>" + (info.tipo === "youtube" ? "YouTube" : "Vimeo") + " · se carga al pulsar</small></button></div>" + tituloHTML + "</div>";
  }

  /* ------------------------------------------------------------------
     Componentes
     ------------------------------------------------------------------ */
  function etiquetaSeccion(n, nombre, extra) {
    return '<div class="etiqueta-seccion">' + icono("i-estrella") + "<b>" + n + "</b><span>" + esc(nombre) + "</span>" + (extra ? "<span>" + extra + "</span>" : "") + "</div>";
  }
  function ficha(p) {
    var cat = categoria(p.categoria), n = num(indiceProyecto(p));
    var formato = ["grande", "mediano", "pequeno", "ancho"].indexOf(p.formato) > -1 ? p.formato : "mediano";
    return '<article class="ficha ficha--' + formato + '" data-revelar><a href="#/proyecto/' + encodeURIComponent(p.id) + '">' +
      medio(p.portada, { pie: false, revelar: false, etiqueta: "Portada · " + cat.nombre + " · Nº " + n, sizes: formato === "ancho" ? "100vw" : "(max-width: 760px) 100vw, 50vw" }) +
      '<div class="ficha__meta"><span class="ficha__num">' + n + '</span><span class="chip">' + esc(cat.nombre) + '</span><span class="ficha__fecha">' + t(p.fecha) + "</span></div>" +
      "<h3>" + t(p.titulo) + "</h3>" + (lleno(p.resumen) ? "<p>" + t(p.resumen) + "</p>" : "") +
      '<span class="leer">Abrir proyecto ' + icono("i-flecha-diag") + "</span></a></article>";
  }

  /* ------------------------------------------------------------------
     001 · PORTADA
     ------------------------------------------------------------------ */
  function titularExperimental(frase) {
    var palabras = String(frase || "").trim().split(/\s+/).filter(Boolean);
    if (!palabras.length) return "";
    var ultima = palabras.pop(), lineas = [];
    for (var i = 0; i < palabras.length; i += 2) lineas.push(palabras.slice(i, i + 2));
    var cuentas = [1, 3, 6];
    var html = lineas.map(function (par, k) {
      var n = cuentas[k % 3], caras = "";
      for (var j = 0; j < n; j++) {
        caras += k === 0 && j === 0
          ? '<img class="cara cara--estrella" src="assets/marca/logo-isa-estrella-360.png" width="356" height="360" alt="">'
          : '<img class="cara" src="assets/marca/logo-isa-cara-azul-360.png" width="360" height="208" alt="">';
      }
      var grupo = '<span class="caras caras--' + n + '" aria-hidden="true">' + caras + "</span>";
      return '<span class="linea"><span>' + esc(par[0]) + "</span>" + (par[1] ? grupo + "<span>" + esc(par[1]) + "</span>" : grupo) + "</span>";
    }).join("");
    html += '<span class="linea"><span>' + esc(ultima) + "</span></span>";
    return '<h1 aria-label="' + esc(frase) + '">' + html + "</h1>";
  }
  function vistaInicio() {
    var I = C.inicio || {}, S = C.sitio || {};
    var cinta = lista(I.cinta).map(function (w) { return "<span>" + esc(w) + "</span>" + icono("i-estrella"); }).join("");
    var cats = lista(C.categorias);
    var destacados = lista(C.proyectos).filter(function (p) { return p.destacado; });
    var protagonista = lleno(I.videoPortada && I.videoPortada.url)
      ? '<div class="video-bloque">' + videoHTML(I.videoPortada) + "</div>"
      : medio(I.imagenPortada, { prioridad: false, etiqueta: "Imagen o vídeo protagonista de portada", sizes: "92vw" });

    return '<div class="vista portada"><div class="envoltorio">' +
      '<div class="portada__cabecera"><p class="mono"><b>Nº 001</b> — ' + esc(S.marca || "ISAENMISA") + " — Edición Granada — " + esc(S.anio || "") + "</p>" +
      '<p class="mono">' + lista(S.especialidades).map(esc).join(" · ") + "</p></div>" +
      '<div class="titular-exp">' + titularExperimental(I.titular) + "</div>" +
      '<div class="portada__cuerpo">' +
        '<div class="portada__presentacion" data-revelar><p>' + t(I.presentacion) + "</p></div>" +
        '<ol class="portada__pilares" data-revelar aria-label="Pilares">' + lista(I.pilares).map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ol>" +
        '<div class="portada__cta" data-revelar><p class="mono">' + lista(C.proyectos).length + " proyectos · " + cats.length + ' categorías</p><a class="boton boton--azul" href="#/archivo">' + esc(I.botonArchivo || "Entrar al archivo visual") + " " + icono("i-flecha") + "</a></div>" +
      "</div>" +
      '<div class="portada__protagonista"><p class="lateral">Fig. 001 — Portada</p>' + protagonista + "</div>" +
      "</div>" +
      (cinta ? '<div class="cinta" aria-hidden="true"><div class="cinta__pista"><div class="cinta__grupo">' + cinta + '</div><div class="cinta__grupo">' + cinta + "</div></div></div>" : "") +
      '<section class="indice envoltorio" aria-labelledby="t-indice">' + etiquetaSeccion("003", "Índice del archivo visual", cats.length + " categorías") +
        '<div class="indice__cabeza"><h2 id="t-indice" class="titulo-medio">Cuatro maneras de <span class="marcado">mirar' + trazoCirculo() + "</span></h2><p>Un archivo vivo de conciertos, retratos, piezas audiovisuales y experimentos. Elige una sección o recórrelo entero.</p></div>" +
        '<ol class="indice__lista">' + cats.map(function (c, i) {
          var cuenta = lista(C.proyectos).filter(function (p) { return p.categoria === c.id; }).length;
          return '<li class="indice__item" data-revelar><a href="#/archivo/' + encodeURIComponent(c.id) + '"><span class="indice__num"><span>0' + (i + 1) + " / " + esc(c.nombre) + "</span>" + icono("i-flecha-diag") + "</span>" +
            medio(c.portada, { pie: false, revelar: false, etiqueta: "Portada de categoría · " + c.nombre, sizes: "(max-width: 760px) 50vw, 25vw" }) +
            '<span class="indice__nombre">' + esc(c.nombre) + "</span><p>" + t(c.descripcion) + '</p><span class="cuenta">' + num(cuenta) + " proyectos</span></a></li>";
        }).join("") + "</ol></section>" +
      (destacados.length ? '<section class="seleccion envoltorio" aria-labelledby="t-sel">' + etiquetaSeccion("—", "Selección", '<a href="#/archivo">Ver todo el archivo</a>') +
        '<h2 id="t-sel" class="oculto">Proyectos seleccionados</h2><div class="rejilla" style="margin-top:2rem">' + destacados.map(ficha).join("") + "</div></section>" : "") +
      "</div>";
  }

  /* ------------------------------------------------------------------
     002 · SOBRE MÍ
     ------------------------------------------------------------------ */
  function vistaSobreMi() {
    var A = C.sobreMi || {};
    var tit = String(A.titular || "Sobre mí").trim().split(/\s+/);
    var ult = tit.pop();
    function tabla(id, titulo, items, campos) {
      if (!lista(items).length) return "";
      return '<section class="tabla-cv" aria-labelledby="' + id + '"><h2 id="' + id + '" class="titulo-medio" data-revelar>' + titulo + "</h2><ol data-revelar>" +
        lista(items).map(function (it) { return '<li><span class="mono">' + t(it.anio) + "</span><strong>" + t(it.titulo) + "</strong><span>" + t(it[campos]) + "</span></li>"; }).join("") + "</ol></section>";
    }
    return '<div class="vista sobre envoltorio">' + etiquetaSeccion("002", "Sobre mí", "Isa Cuadros · @isaenmisa") +
      '<div class="sobre__cabeza"><h1 class="titulo-grande">' + esc(tit.join(" ")) + ' <span class="azul marcado">' + esc(ult) + trazoCirculo() + '</span></h1><p class="mono">' + esc((C.sitio || {}).profesion || "") + "<br>" + lista((C.sitio || {}).especialidades).map(esc).join(" / ") + "</p></div>" +
      '<div class="sobre__intro"><div class="sobre__retrato" data-revelar><img class="sello" src="assets/marca/logo-isa-estrella-360.png" width="356" height="360" alt="">' + medio(A.retrato, { revelar: false, etiqueta: "Retrato · Isa Cuadros", sizes: "(max-width: 760px) 100vw, 40vw" }) + "</div>" +
        '<div class="sobre__texto" data-revelar><p class="entradilla">' + t(A.entradilla) + '</p><div class="cuerpo">' + lista(A.texto).map(function (p) { return "<p>" + t(p) + "</p>"; }).join("") + "</div></div></div>" +
      '<section class="pilares3" aria-label="Pilares">' + lista(A.pilares).map(function (p, i) {
        return '<article data-revelar><span class="num">0' + (i + 1) + "</span><h3>" + esc(p.nombre) + "</h3><p>" + t(p.texto) + "</p></article>";
      }).join("") + "</section>" +
      tabla("t-formacion", "Formación", A.formacion, "lugar") +
      tabla("t-trayectoria", "Trayectoria", A.trayectoria, "detalle") +
      (lista(A.intereses).length ? '<section class="tabla-cv" aria-labelledby="t-intereses"><h2 id="t-intereses" class="titulo-medio" data-revelar>Intereses e influencias</h2><ul class="intereses" style="grid-column:5 / span 8" data-revelar>' + lista(A.intereses).map(function (x) { return "<li>" + t(x) + "</li>"; }).join("") + "</ul></section>" : "") +
      (lista(A.colaboraciones).length ? '<section class="tabla-cv" aria-labelledby="t-colab"><h2 id="t-colab" class="titulo-medio" data-revelar>Colaboraciones y créditos</h2><ol data-revelar>' + lista(A.colaboraciones).map(function (x, i) { return '<li><span class="mono">' + num(i + 1) + "</span><strong>" + t(x) + "</strong><span></span></li>"; }).join("") + "</ol></section>" : "") +
      "</div>" +
      (lleno(A.filosofia) ? '<section class="filosofia" aria-label="Filosofía creativa"><blockquote data-revelar>' + t(A.filosofia) + '</blockquote><span class="mono">— Filosofía creativa</span></section>' : "") +
      (lista(A.fotos).length ? '<div class="envoltorio"><div class="fotos-sobre">' + lista(A.fotos).map(function (f, i) { return medio(f, { grupo: "sobre", etiqueta: "Foto de proceso " + num(i + 1) }); }).join("") + "</div></div>" : "");
  }

  /* ------------------------------------------------------------------
     003 · ARCHIVO VISUAL
     ------------------------------------------------------------------ */
  function vistaArchivo(filtro) {
    var cats = lista(C.categorias), todos = lista(C.proyectos);
    var cat = filtro ? categoria(filtro) : null;
    var proyectos = filtro ? todos.filter(function (p) { return p.categoria === filtro; }) : todos;
    var filtros = '<a href="#/archivo"' + (!filtro ? ' aria-current="true"' : "") + ">Todo<sup>" + todos.length + "</sup></a>" +
      cats.map(function (c) {
        var n = todos.filter(function (p) { return p.categoria === c.id; }).length;
        return '<a href="#/archivo/' + encodeURIComponent(c.id) + '"' + (filtro === c.id ? ' aria-current="true"' : "") + ">" + esc(c.nombre) + "<sup>" + n + "</sup></a>";
      }).join("");
    return '<div class="vista archivo envoltorio">' + etiquetaSeccion("003", "Archivo visual", num(proyectos.length) + " proyectos") +
      '<div class="archivo__cabeza"><span class="garabato" aria-hidden="true"></span><h1 class="titulo-grande">Archivo<br><span class="azul">' + (cat ? esc(cat.nombre) : "Visual") + "</span></h1></div>" +
      '<div class="archivo__barra"><nav class="filtros" aria-label="Filtrar por categoría">' + filtros + '</nav><p class="archivo__desc">' + (cat ? t(cat.descripcion) : "Events · Photography · Film · Art Direction. Todo el trabajo, ordenado como una revista.") + "</p></div>" +
      '<div class="rejilla">' + (proyectos.length ? proyectos.map(ficha).join("") : '<p class="vacio">Todavía no hay proyectos en esta categoría.</p>') + "</div></div>";
  }

  /* ------------------------------------------------------------------
     PROYECTO INDIVIDUAL
     ------------------------------------------------------------------ */
  function vistaProyecto(id) {
    var todos = lista(C.proyectos), i = -1;
    todos.forEach(function (p, k) { if (p.id === id) i = k; });
    if (i < 0) return vista404();
    var p = todos[i], cat = categoria(p.categoria), n = num(i + 1);
    var ant = todos[(i - 1 + todos.length) % todos.length], sig = todos[(i + 1) % todos.length];
    var galeria = lista(p.galeria), videos = lista(p.videos);
    var datos = [["Fecha", p.fecha], ["Lugar", p.lugar], ["Rol", p.rol], ["Categoría", cat.nombre]].filter(function (d) { return lleno(d[1]); });
    var grupo = "p-" + p.id;
    return '<article class="vista proyecto envoltorio">' +
      '<nav class="migas mono" aria-label="Ruta"><a href="#/archivo">Archivo</a> / <a href="#/archivo/' + encodeURIComponent(cat.id) + '">' + esc(cat.nombre) + "</a> / <span>Nº " + n + "</span></nav>" +
      '<header class="proyecto__cabeza"><span class="proyecto__num" aria-hidden="true">' + n + "</span><h1>" + t(p.titulo) + "</h1></header>" +
      '<dl class="proyecto__ficha">' + datos.map(function (d) { return "<div><dt>" + d[0] + "</dt><dd>" + t(d[1]) + "</dd></div>"; }).join("") + "</dl>" +
      '<div class="proyecto__portada">' + medio(p.portada, { grupo: grupo, etiqueta: "Portada del proyecto Nº " + n, sizes: "100vw", prioridad: true }) + "</div>" +
      '<div class="proyecto__cuerpo"><div class="proyecto__texto" data-revelar>' + lista(p.descripcion).map(function (x) { return "<p>" + t(x) + "</p>"; }).join("") + "</div>" +
        '<aside class="proyecto__creditos" data-revelar><h2>Créditos</h2><dl>' + lista(p.creditos).map(function (c) { return "<div><dt>" + t(c.rol) + "</dt><dd>" + t(c.nombre) + "</dd></div>"; }).join("") + "</dl>" +
        (lista(p.enlaces).length ? '<div class="proyecto__enlaces">' + lista(p.enlaces).filter(function (e) { return lleno(e.url); }).map(function (e) { return '<a href="' + esc(e.url) + '" target="_blank" rel="noopener">' + esc(e.texto || e.url) + " ↗</a>"; }).join("") + "</div>" : "") +
        "</aside></div>" +
      (videos.length ? '<section class="proyecto__bloque" aria-label="Vídeos"><h2>Material audiovisual <span class="mono">' + num(videos.length) + '</span></h2><div class="videos">' + videos.map(videoHTML).join("") + "</div></section>" : "") +
      (galeria.length ? '<section class="proyecto__bloque" aria-label="Galería"><h2>Galería <span class="mono">' + num(galeria.length) + ' imágenes</span></h2><div class="galeria">' +
        galeria.map(function (g, k) {
          var tot = String(galeria.length).padStart(2, "0"), nn = String(k + 1).padStart(2, "0");
          var img = Object.assign({}, g, { pie: g.pie || " " });
          return medio(img, { grupo: grupo, etiqueta: "Galería · " + nn + " / " + tot, prefijo: "<b>" + nn + "/" + tot + "</b>", sizes: "(max-width: 760px) 100vw, 50vw" });
        }).join("") + "</div></section>" : "") +
      (todos.length > 1 ? '<nav class="proyecto__nav" aria-label="Otros proyectos"><a href="#/proyecto/' + encodeURIComponent(ant.id) + '"><span class="mono">← Anterior · Nº ' + num(indiceProyecto(ant)) + "</span><strong>" + t(ant.titulo) + '</strong></a><a href="#/proyecto/' + encodeURIComponent(sig.id) + '"><span class="mono">Siguiente · Nº ' + num(indiceProyecto(sig)) + " →</span><strong>" + t(sig.titulo) + "</strong></a></nav>" : "") +
      "</article>";
  }

  /* ------------------------------------------------------------------
     004 · CONTACTO
     ------------------------------------------------------------------ */
  function enlacesContacto() {
    var K = C.contacto || {};
    var tel = String(K.telefono || "").replace(/[^\d+]/g, "");
    var ig = String(K.instagram || "").replace(/^@/, "");
    var filas = [];
    if (lleno(K.email)) filas.push({ id: "email", et: "Email", txt: K.email, url: "mailto:" + K.email, copiar: K.email });
    if (lleno(K.telefono)) filas.push({ id: "telefono", et: "Teléfono", txt: K.telefono, url: "tel:" + tel, copiar: K.telefono });
    if (lleno(ig)) filas.push({ id: "instagram", et: "Instagram", txt: "@" + ig, url: "https://www.instagram.com/" + encodeURIComponent(ig) + "/", externo: true });
    if (lleno(K.vimeo)) filas.push({ id: "vimeo", et: "Vimeo", txt: K.vimeo.replace(/^https?:\/\/(www\.)?/, ""), url: K.vimeo, externo: true });
    if (lleno(K.youtube)) filas.push({ id: "youtube", et: "YouTube", txt: K.youtube.replace(/^https?:\/\/(www\.)?/, ""), url: K.youtube, externo: true });
    if (lleno(K.ubicacion)) filas.push({ id: "ubicacion", et: "Ubicación", txt: K.ubicacion, url: "https://www.openstreetmap.org/search?query=" + encodeURIComponent(K.ubicacion), externo: true });
    return filas;
  }
  function vistaContacto() {
    var K = C.contacto || {}, F = K.formulario || {};
    return '<div class="vista contacto envoltorio">' + etiquetaSeccion("004", "Contacto", esc(K.ubicacion || "")) +
      '<div class="contacto__cabeza"><h1 class="titulo-grande"><span class="marcado">' + esc(K.titular || "Hablemos") + trazoCirculo() + '</span></h1><p class="contacto__bienvenida" data-revelar>' + t(K.bienvenida) + "</p></div>" +
      '<div class="contacto__rejilla"><ul class="datos" data-revelar>' + enlacesContacto().map(function (f) {
        return '<li><span class="mono">' + f.et + '</span><a href="' + esc(f.url) + '"' + (f.externo ? ' target="_blank" rel="noopener"' : "") + ">" + esc(f.txt) + (f.externo ? " ↗" : "") + "</a>" +
          (f.copiar ? '<button class="copiar" type="button" data-copiar="' + esc(f.copiar) + '">Copiar</button>' : "<span></span>") + "</li>";
      }).join("") + "</ul>" +
      '<form class="formulario" id="formulario" novalidate data-revelar><h2>Escríbeme</h2>' +
        '<div class="campo"><label for="f-nombre">Nombre *</label><input id="f-nombre" name="nombre" autocomplete="name" required></div>' +
        '<div class="campo"><label for="f-email">Email *</label><input id="f-email" name="email" type="email" autocomplete="email" required></div>' +
        '<div class="campo"><label for="f-tipo">Tipo de proyecto</label><select id="f-tipo" name="tipo"><option value="">Selecciona una opción</option>' + lista(F.tipos).map(function (o) { return "<option>" + esc(o) + "</option>"; }).join("") + "</select></div>" +
        '<div class="campo"><label for="f-mensaje">Mensaje *</label><textarea id="f-mensaje" name="mensaje" required placeholder="Cuéntame la idea, fechas, lugar…"></textarea></div>' +
        '<div class="trampa" aria-hidden="true"><label for="f-web">No rellenar</label><input id="f-web" name="_gotcha" tabindex="-1" autocomplete="off"></div>' +
        '<div class="campo campo--check"><input id="f-acepto" name="acepto" type="checkbox" required><label for="f-acepto">Acepto que se usen estos datos solo para responder a mi mensaje. *</label></div>' +
        '<button class="boton boton--azul" type="submit">Enviar mensaje ' + icono("i-flecha") + "</button>" +
        '<p class="formulario__estado" id="formulario-estado" role="status" aria-live="polite"></p>' +
        '<p class="formulario__nota">' + (lleno(F.endpoint) ? "El mensaje se envía directamente desde esta página." : "Al enviar se abrirá tu aplicación de correo con el mensaje ya preparado para " + esc(K.email) + ".") + "</p>" +
      "</form></div></div>";
  }

  function vista404() {
    return '<div class="vista envoltorio" style="padding-top:3rem">' + etiquetaSeccion("404", "Página no encontrada") +
      '<h1 class="titulo-grande" style="margin-top:2rem">Fuera de <span class="marcado" style="color:var(--azul)">plano' + trazoCirculo() + '</span></h1><p style="margin-top:2rem"><a class="boton" href="#/">Volver a la portada</a></p></div>';
  }

  /* ------------------------------------------------------------------
     Pie de página
     ------------------------------------------------------------------ */
  function pintarPie() {
    var S = C.sitio || {};
    document.getElementById("pie").innerHTML =
      '<div class="pie__marca"><span class="marca-texto" role="img" aria-label="ISAENMISA"></span><img src="assets/marca/logo-isa-estrella-360.png" width="356" height="360" alt=""></div>' +
      '<div class="pie__filas">' +
        '<div><h2>Índice</h2><ul><li><a href="#/">001 Inicio</a></li><li><a href="#/sobre-mi">002 Sobre mí</a></li><li><a href="#/archivo">003 Archivo visual</a></li><li><a href="#/contacto">004 Contacto</a></li></ul></div>' +
        "<div><h2>Archivo</h2><ul>" + lista(C.categorias).map(function (c) { return '<li><a href="#/archivo/' + encodeURIComponent(c.id) + '">' + esc(c.nombre) + "</a></li>"; }).join("") + "</ul></div>" +
        "<div><h2>Contacto</h2><ul>" + enlacesContacto().filter(function (f) { return f.id !== "ubicacion"; }).map(function (f) { return '<li><a href="' + esc(f.url) + '"' + (f.externo ? ' target="_blank" rel="noopener"' : "") + ">" + esc(f.txt) + "</a></li>"; }).join("") + "</ul></div>" +
        "<div><h2>Base</h2><p>" + esc((C.contacto || {}).ubicacion || "") + "<br>" + esc(S.profesion || "") + "<br>" + lista(S.especialidades).map(esc).join(" · ") + "</p></div>" +
      "</div>" +
      '<div class="pie__base"><p class="mono">© ' + esc(S.anio || new Date().getFullYear()) + " " + esc(S.nombre || "") + ' · Todas las imágenes pertenecen a su autora</p><button class="pie__subir" type="button" data-subir>Volver arriba ↑</button></div>';
  }

  /* ------------------------------------------------------------------
     Enrutador
     ------------------------------------------------------------------ */
  var rutas = {
    "inicio": { n: "001", titulo: null },
    "sobre-mi": { n: "002", titulo: "Sobre mí" },
    "archivo": { n: "003", titulo: "Archivo visual" },
    "proyecto": { n: "003", titulo: "Proyecto" },
    "contacto": { n: "004", titulo: "Contacto" }
  };
  function navegar() {
    // Anclas internas (p. ej. "Saltar al contenido") no cambian de página
    if (location.hash && location.hash.indexOf("#/") !== 0 && navegar.yaIniciada) return;
    var partes = ((location.hash.indexOf("#/") === 0 ? location.hash : "").replace(/^#\/?/, "") || "").split("/").map(decodeURIComponent);
    var nombre = partes[0] || "inicio", html, titulo;
    galerias = {};
    if (nombre === "inicio" || nombre === "") html = vistaInicio();
    else if (nombre === "sobre-mi") html = vistaSobreMi();
    else if (nombre === "archivo") { html = vistaArchivo(partes[1]); if (partes[1]) titulo = "Archivo · " + categoria(partes[1]).nombre; }
    else if (nombre === "proyecto") {
      html = vistaProyecto(partes[1]);
      var p = lista(C.proyectos).filter(function (x) { return x.id === partes[1]; })[0];
      if (p) titulo = (esPendiente(p.titulo) ? "Proyecto Nº " + num(indiceProyecto(p)) : p.titulo) + " · " + categoria(p.categoria).nombre;
    }
    else if (nombre === "contacto") html = vistaContacto();
    else { html = vista404(); nombre = "404"; titulo = "Página no encontrada"; }

    principal.innerHTML = html;
    var info = rutas[nombre] || { n: "000" };
    titulo = titulo || info.titulo;
    var S = C.sitio || {};
    document.title = titulo ? titulo + " — " + (S.nombre || "") + " · @" + String((C.contacto || {}).instagram || "").replace(/^@/, "") : (S.tituloSEO || document.title);
    var md = document.querySelector('meta[name="description"]'); if (md && S.descripcionSEO) md.setAttribute("content", S.descripcionSEO);
    document.querySelector("[data-num-seccion]").textContent = info.n;
    var raiz = nombre === "proyecto" ? "archivo" : nombre;
    document.querySelectorAll(".nav__lista a").forEach(function (a) {
      if (a.getAttribute("data-ruta") === raiz) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    cerrarMenu();
    window.scrollTo(0, 0);
    if (navegar.yaIniciada) principal.focus({ preventScroll: true });
    navegar.yaIniciada = true;
    activar();
  }

  /* ------------------------------------------------------------------
     Interacciones tras pintar
     ------------------------------------------------------------------ */
  var observador = "IntersectionObserver" in window && !reducido ? new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("visible"); observador.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }) : null;

  function ajustarTitular() {
    var h1 = document.querySelector(".titular-exp h1");
    if (!h1) return;
    h1.style.fontSize = "";
    var tamano = parseFloat(getComputedStyle(h1).fontSize), intentos = 0;
    function desborda() {
      return Array.prototype.some.call(h1.querySelectorAll(".linea"), function (l) { return l.scrollWidth > l.clientWidth + 1; });
    }
    while (desborda() && intentos++ < 30) { tamano *= 0.97; h1.style.fontSize = tamano + "px"; }
  }

  function activar() {
    principal.querySelectorAll("[data-revelar]").forEach(function (el) { if (observador) observador.observe(el); else el.classList.add("visible"); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajustarTitular);
    ajustarTitular();
    var form = document.getElementById("formulario");
    if (form) form.addEventListener("submit", enviarFormulario);
  }

  // Delegación de eventos (sirve para todo el contenido pintado)
  document.addEventListener("click", function (e) {
    var b;
    if ((b = e.target.closest("[data-video]"))) {
      var cont = b.parentNode;
      cont.innerHTML = '<iframe src="' + esc(b.getAttribute("data-video")) + '" title="' + esc(b.getAttribute("data-titulo")) + '" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen loading="lazy"></iframe>';
    } else if ((b = e.target.closest("[data-visor]"))) {
      abrirVisor(b.getAttribute("data-visor"), +b.getAttribute("data-indice"), b);
    } else if ((b = e.target.closest("[data-copiar]"))) {
      var texto = b.getAttribute("data-copiar");
      (navigator.clipboard ? navigator.clipboard.writeText(texto) : Promise.reject()).then(function () { avisar("Copiado: " + texto); }, function () { avisar("No se pudo copiar. Selecciona el texto: " + texto); });
    } else if ((b = e.target.closest("[data-subir]"))) {
      window.scrollTo({ top: 0, behavior: reducido ? "auto" : "smooth" });
      document.querySelector(".cabecera__marca").focus();
    }
  });

  /* ------------------------------------------------------------------
     Menú móvil
     ------------------------------------------------------------------ */
  var botonMenu = document.querySelector(".nav__boton"), listaMenu = document.getElementById("nav-lista");
  function cerrarMenu() {
    if (!listaMenu.classList.contains("abierta")) return;
    listaMenu.classList.remove("abierta"); botonMenu.setAttribute("aria-expanded", "false");
    botonMenu.querySelector(".nav__boton-texto").textContent = "Menú"; document.body.style.overflow = "";
  }
  botonMenu.addEventListener("click", function () {
    var abrir = !listaMenu.classList.contains("abierta");
    if (!abrir) { cerrarMenu(); return; }
    listaMenu.classList.add("abierta"); botonMenu.setAttribute("aria-expanded", "true");
    botonMenu.querySelector(".nav__boton-texto").textContent = "Cerrar"; document.body.style.overflow = "hidden";
    listaMenu.querySelector("a").focus();
  });
  listaMenu.addEventListener("click", function (e) { if (e.target.closest("a")) cerrarMenu(); });

  /* ------------------------------------------------------------------
     Visor de imágenes (galerías interactivas)
     ------------------------------------------------------------------ */
  var visor = document.getElementById("visor"), visorEstado = { grupo: null, i: 0, origen: null };
  function pintarVisor() {
    var items = galerias[visorEstado.grupo] || [], img = items[visorEstado.i] || {};
    visor.querySelector(".visor__media").innerHTML = lleno(img.archivo)
      ? '<img src="' + esc(ruta(img.archivo)) + '" alt="' + esc(img.alt || "") + '">'
      : marcador(img, "Sustituir por fotografía");
    visor.querySelector(".visor__pie").innerHTML = String(visorEstado.i + 1).padStart(2, "0") + " / " + String(items.length).padStart(2, "0") + (lleno(img.pie) && img.pie.trim() ? " — " + t(img.pie) : "");
    var varias = items.length > 1;
    visor.querySelectorAll(".visor__nav").forEach(function (b) { b.hidden = !varias; });
  }
  function abrirVisor(grupo, i, origen) {
    visorEstado = { grupo: grupo, i: i, origen: origen };
    pintarVisor(); visor.hidden = false; document.body.style.overflow = "hidden";
    visor.querySelector(".visor__cerrar").focus();
  }
  function cerrarVisor() {
    visor.hidden = true; document.body.style.overflow = "";
    if (visorEstado.origen) visorEstado.origen.focus();
  }
  function moverVisor(d) {
    var n = (galerias[visorEstado.grupo] || []).length; if (!n) return;
    visorEstado.i = (visorEstado.i + d + n) % n; pintarVisor();
  }
  visor.querySelector(".visor__cerrar").addEventListener("click", cerrarVisor);
  visor.querySelector(".visor__nav--ant").addEventListener("click", function () { moverVisor(-1); });
  visor.querySelector(".visor__nav--sig").addEventListener("click", function () { moverVisor(1); });
  visor.addEventListener("click", function (e) { if (e.target === visor) cerrarVisor(); });
  var toqueX = null;
  visor.addEventListener("touchstart", function (e) { toqueX = e.touches[0].clientX; }, { passive: true });
  visor.addEventListener("touchend", function (e) {
    if (toqueX == null) return; var dx = e.changedTouches[0].clientX - toqueX; toqueX = null;
    if (Math.abs(dx) > 50) moverVisor(dx < 0 ? 1 : -1);
  });
  document.addEventListener("keydown", function (e) {
    if (!visor.hidden) {
      if (e.key === "Escape") cerrarVisor();
      else if (e.key === "ArrowLeft") moverVisor(-1);
      else if (e.key === "ArrowRight") moverVisor(1);
      else if (e.key === "Tab") { // mantener el foco dentro del visor
        var f = Array.prototype.filter.call(visor.querySelectorAll("button"), function (b) { return !b.hidden; });
        var idx = f.indexOf(document.activeElement);
        if (e.shiftKey && idx <= 0) { f[f.length - 1].focus(); e.preventDefault(); }
        else if (!e.shiftKey && idx === f.length - 1) { f[0].focus(); e.preventDefault(); }
      }
    } else if (e.key === "Escape") cerrarMenu();
  });

  /* ------------------------------------------------------------------
     Formulario de contacto
     - Si contacto.formulario.endpoint tiene una URL (Formspree, Getform,
       Basin…), el mensaje se envía por POST desde la propia página.
     - Si está vacío, se abre el correo del visitante con el mensaje listo.
     ------------------------------------------------------------------ */
  function enviarFormulario(e) {
    e.preventDefault();
    var f = e.target, K = C.contacto || {}, estado = document.getElementById("formulario-estado");
    f.querySelectorAll(".error-campo").forEach(function (x) { x.remove(); });
    f.querySelectorAll("[aria-invalid]").forEach(function (x) { x.removeAttribute("aria-invalid"); });
    var errores = [];
    function error(campo, msg) {
      campo.setAttribute("aria-invalid", "true");
      var s = document.createElement("span"); s.className = "error-campo"; s.id = campo.id + "-error"; s.textContent = msg;
      campo.setAttribute("aria-describedby", s.id);
      (campo.type === "checkbox" ? campo.parentNode : campo.parentNode).appendChild(s); errores.push(campo);
    }
    if (!f.nombre.value.trim()) error(f.nombre, "Escribe tu nombre.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim())) error(f.email, "Escribe un email válido.");
    if (f.mensaje.value.trim().length < 5) error(f.mensaje, "Escribe tu mensaje.");
    if (!f.acepto.checked) error(f.acepto, "Necesito tu permiso para responderte.");
    if (errores.length) { estado.className = "formulario__estado error"; estado.textContent = "Revisa los campos marcados."; errores[0].focus(); return; }
    if (f._gotcha.value) return; // bots

    var datos = { nombre: f.nombre.value.trim(), email: f.email.value.trim(), tipo: f.tipo.value, mensaje: f.mensaje.value.trim() };
    var endpoint = ((K.formulario || {}).endpoint || "").trim();
    var boton = f.querySelector("button[type=submit]");

    if (endpoint) {
      boton.disabled = true; estado.className = "formulario__estado"; estado.textContent = "Enviando…";
      var fd = new FormData(); Object.keys(datos).forEach(function (k) { fd.append(k, datos[k]); });
      fd.append("_subject", "Contacto web — " + (datos.tipo || "Mensaje") + " — " + datos.nombre);
      fetch(endpoint, { method: "POST", body: fd, headers: { Accept: "application/json" } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); })
        .then(function () { f.reset(); estado.className = "formulario__estado ok"; estado.textContent = "Mensaje enviado. Te responderé pronto. ✶"; })
        .catch(function () { estado.className = "formulario__estado error"; estado.innerHTML = 'No se pudo enviar. Escríbeme directamente a <a href="mailto:' + esc(K.email) + '">' + esc(K.email) + "</a>."; })
        .then(function () { boton.disabled = false; });
      return;
    }
    var asunto = "Contacto web — " + (datos.tipo || "Mensaje") + " — " + datos.nombre;
    var cuerpo = datos.mensaje + "\n\n— \n" + datos.nombre + "\n" + datos.email + (datos.tipo ? "\nTipo de proyecto: " + datos.tipo : "");
    window.location.href = "mailto:" + K.email + "?subject=" + encodeURIComponent(asunto) + "&body=" + encodeURIComponent(cuerpo);
    estado.className = "formulario__estado ok";
    estado.innerHTML = 'Se ha abierto tu aplicación de correo con el mensaje preparado. Si no se abre, escribe a <a href="mailto:' + esc(K.email) + '">' + esc(K.email) + "</a>.";
  }

  /* ------------------------------------------------------------------
     Vista previa desde el editor (admin.html): usa el borrador guardado
     en este navegador sin tocar los archivos publicados.
     ------------------------------------------------------------------ */
  function cargarBorrador() {
    return new Promise(function (resolver) {
      if (!/[?&]vista-previa\b/.test(location.search)) return resolver();
      try {
        var b = localStorage.getItem("isaenmisa-borrador");
        if (b) C = JSON.parse(b);
      } catch (err) { /* sin borrador */ }
      if (!window.indexedDB) return resolver();
      var pet = indexedDB.open("isaenmisa-editor", 1);
      pet.onupgradeneeded = function () { pet.result.createObjectStore("imagenes"); };
      pet.onerror = function () { resolver(); };
      pet.onsuccess = function () {
        try {
          var tx = pet.result.transaction("imagenes", "readonly"), st = tx.objectStore("imagenes"), cur = st.openCursor();
          cur.onsuccess = function () {
            var c = cur.result;
            if (c) { imagenesBorrador[c.key] = URL.createObjectURL(c.value); c.continue(); } else resolver();
          };
          cur.onerror = function () { resolver(); };
        } catch (err) { resolver(); }
      };
    }).then(function () {
      if (/[?&]vista-previa\b/.test(location.search)) {
        var b = document.createElement("div");
        b.setAttribute("role", "note");
        b.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:700;background:#000;color:#fff;font:13px/1.3 'Anonymous Pro',monospace;text-transform:uppercase;padding:.6rem 1rem;text-align:center";
        b.textContent = "Vista previa del borrador · Estos cambios aún no están publicados";
        document.body.appendChild(b);
      }
    });
  }

  /* ------------------------------------------------------------------
     Arranque
     ------------------------------------------------------------------ */
  if (!C) { principal.innerHTML = '<p style="padding:2rem">No se encontró contenido/contenido.js.</p>'; return; }
  cargarBorrador().then(function () {
    pintarPie();
    navegar();
    window.addEventListener("hashchange", navegar);
    var temporizador;
    window.addEventListener("resize", function () { clearTimeout(temporizador); temporizador = setTimeout(ajustarTitular, 120); });
  });
})();
