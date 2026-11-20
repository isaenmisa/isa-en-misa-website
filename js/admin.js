/* =====================================================================
   ISAENMISA · EDITOR DE CONTENIDO (admin.html)
   ---------------------------------------------------------------------
   Qué hace de verdad:
   - Edita una copia del contenido en tu navegador (borrador automático).
   - Optimiza las fotos que subes (WebP, versión grande + versión móvil).
   - Vista previa del borrador en la web real (index.html?vista-previa).
   - Exporta los cambios: guarda directamente en la carpeta de la web
     (Chrome/Edge en ordenador) o descarga un .zip / contenido.js.
   Qué NO hace: publicar en internet por sí solo. Una web estática no
   tiene servidor; tras exportar, sube los archivos a tu alojamiento.
   ===================================================================== */
(function () {
  "use strict";

  var CLAVE = "isaenmisa-borrador";
  var publicado = JSON.parse(JSON.stringify(window.CONTENIDO || {}));
  var E;                       // estado (borrador)
  var urls = {};               // ruta -> objectURL de imágenes nuevas
  var pestana = "general", proyectoAbierto = null;
  var panel = document.getElementById("panel");

  /* ---------------- utilidades ---------------- */
  function $(h) { var d = document.createElement("div"); d.innerHTML = h.trim(); return d.firstChild; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function get(ruta) { return ruta.reduce(function (o, k) { return o == null ? undefined : o[k]; }, E); }
  function set(ruta, v) { var o = E; for (var i = 0; i < ruta.length - 1; i++) { if (o[ruta[i]] == null) o[ruta[i]] = typeof ruta[i + 1] === "number" ? [] : {}; o = o[ruta[i]]; } o[ruta[ruta.length - 1]] = v; cambiado(); }
  function num(n) { return String(n).padStart(3, "0"); }
  function slug(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "proyecto"; }
  function imgVacia(w, h) { return { archivo: "", movil: "", ancho: w || 1600, alto: h || 1067, alt: "", pie: "" }; }
  var uid = 0; function id() { return "c" + (++uid); }
  function avisar(msg, error) {
    var a = document.getElementById("aviso"); a.textContent = msg; a.className = "aviso visible" + (error ? " error" : "");
    clearTimeout(avisar.t); avisar.t = setTimeout(function () { a.className = "aviso"; }, error ? 6000 : 3000);
  }
  function estado(msg) { document.getElementById("estado").textContent = msg; }

  /* ---------------- borrador ---------------- */
  var tGuardar;
  function cambiado() {
    estado("Guardando borrador…");
    clearTimeout(tGuardar); tGuardar = setTimeout(guardarBorrador, 400);
  }
  function guardarBorrador() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(E));
      localStorage.setItem(CLAVE + "-hora", new Date().toISOString());
      estado("Borrador guardado en este navegador · " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) + " · sin exportar");
    } catch (err) { estado("No se pudo guardar el borrador en este navegador"); }
  }

  /* ---------------- IndexedDB (fotos nuevas) ---------------- */
  var dbP = new Promise(function (ok, mal) {
    if (!window.indexedDB) return mal(new Error("sin IndexedDB"));
    var r = indexedDB.open("isaenmisa-editor", 1);
    r.onupgradeneeded = function () { r.result.createObjectStore("imagenes"); };
    r.onsuccess = function () { ok(r.result); }; r.onerror = function () { mal(r.error); };
  });
  function idb(modo, fn) {
    return dbP.then(function (db) {
      return new Promise(function (ok, mal) {
        var tx = db.transaction("imagenes", modo), st = tx.objectStore("imagenes"), res = fn(st);
        tx.oncomplete = function () { ok(res && res.result !== undefined ? res.result : res); }; tx.onerror = function () { mal(tx.error); };
      });
    });
  }
  function guardarBlob(ruta, blob) { urls[ruta] = URL.createObjectURL(blob); return idb("readwrite", function (st) { st.put(blob, ruta); }); }
  function todosBlobs() {
    return dbP.then(function (db) {
      return new Promise(function (ok) {
        var out = {}, c = db.transaction("imagenes").objectStore("imagenes").openCursor();
        c.onsuccess = function () { var k = c.result; if (k) { out[k.key] = k.value; k.continue(); } else ok(out); };
        c.onerror = function () { ok(out); };
      });
    }).catch(function () { return {}; });
  }
  function rutasUsadas() {
    var s = {};
    (function rec(o) {
      if (Array.isArray(o)) o.forEach(rec);
      else if (o && typeof o === "object") Object.keys(o).forEach(function (k) {
        if ((k === "archivo" || k === "movil") && typeof o[k] === "string" && o[k]) s[o[k]] = 1;
        else if (k === "url" && typeof o[k] === "string" && /^img\//.test(o[k])) s[o[k]] = 1;
        else rec(o[k]);
      });
    })(E);
    return s;
  }

  /* ---------------- optimización de imágenes ---------------- */
  var soportaWebp = (function () { try { var c = document.createElement("canvas"); c.width = c.height = 1; return c.toDataURL("image/webp").indexOf("data:image/webp") === 0; } catch (e) { return false; } })();
  function cargarImagen(file) {
    return new Promise(function (ok, mal) {
      var u = URL.createObjectURL(file), im = new Image();
      im.onload = function () { ok(im); }; im.onerror = function () { mal(new Error("No se pudo leer la imagen " + file.name)); };
      im.src = u;
    });
  }
  function reducir(im, max, calidad) {
    var w = im.naturalWidth, h = im.naturalHeight, k = Math.min(1, max / Math.max(w, h));
    var c = document.createElement("canvas"); c.width = Math.round(w * k); c.height = Math.round(h * k);
    var ctx = c.getContext("2d"); ctx.imageSmoothingQuality = "high"; ctx.drawImage(im, 0, 0, c.width, c.height);
    return new Promise(function (ok) { c.toBlob(function (b) { ok({ blob: b, ancho: c.width, alto: c.height }); }, soportaWebp ? "image/webp" : "image/jpeg", calidad); });
  }
  // Devuelve el objeto imagen listo para contenido.js
  function procesarFoto(file, carpeta, base) {
    var ext = soportaWebp ? ".webp" : ".jpg", marca = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    var nombre = "img/" + carpeta + "/" + slug(base || file.name.replace(/\.[^.]+$/, "")) + "-" + marca;
    return cargarImagen(file).then(function (im) {
      return Promise.all([reducir(im, 2400, 0.84), reducir(im, 900, 0.8)]).then(function (r) {
        var grande = nombre + ext, movil = nombre + "-900" + ext;
        return Promise.all([guardarBlob(grande, r[0].blob), guardarBlob(movil, r[1].blob)]).then(function () {
          avisar("Foto optimizada: " + Math.round(file.size / 1024) + " KB → " + Math.round(r[0].blob.size / 1024) + " KB (+ versión móvil " + Math.round(r[1].blob.size / 1024) + " KB)");
          return { archivo: grande, movil: movil, ancho: r[0].ancho, alto: r[0].alto };
        });
      });
    });
  }
  function procesarVideoArchivo(file, carpeta) {
    var ruta = "img/" + carpeta + "/" + slug(file.name.replace(/\.[^.]+$/, "")) + "-" + Date.now().toString(36) + "." + (file.name.split(".").pop() || "mp4").toLowerCase();
    return guardarBlob(ruta, file).then(function () { return ruta; });
  }

  /* ---------------- constructores de campos ---------------- */
  function campo(label, ruta, op) {
    op = op || {};
    var i = id(), v = get(ruta);
    var html = '<div class="campo"><label for="' + i + '">' + esc(label) + "</label>" +
      (op.multilinea ? '<textarea id="' + i + '" rows="' + (op.filas || 3) + '"></textarea>' : '<input id="' + i + '" type="' + (op.tipo || "text") + '"' + (op.placeholder ? ' placeholder="' + esc(op.placeholder) + '"' : "") + ">") +
      (op.ayuda ? '<p class="ayuda">' + op.ayuda + "</p>" : "") + "</div>";
    var el = $(html), inp = el.querySelector("input,textarea");
    inp.value = v == null ? "" : v;
    inp.addEventListener("input", function () { set(ruta, inp.value); if (op.alCambiar) op.alCambiar(inp.value, el); });
    if (op.alCambiar) op.alCambiar(inp.value, el, true);
    return el;
  }
  // Lista de textos: una entrada por línea (o por párrafo separado con línea en blanco)
  function campoLista(label, ruta, op) {
    op = op || {};
    var i = id(), sep = op.parrafos ? "\n\n" : "\n";
    var el = $('<div class="campo"><label for="' + i + '">' + esc(label) + '</label><textarea id="' + i + '" rows="' + (op.filas || 4) + '"></textarea><p class="ayuda">' + (op.parrafos ? "Separa los párrafos con una línea en blanco." : "Un elemento por línea.") + (op.ayuda ? " " + op.ayuda : "") + "</p></div>");
    var ta = el.querySelector("textarea");
    ta.value = (get(ruta) || []).join(sep);
    ta.addEventListener("input", function () {
      var partes = op.parrafos ? ta.value.split(/\n\s*\n/) : ta.value.split("\n");
      set(ruta, partes.map(function (s) { return s.trim(); }).filter(Boolean));
    });
    return el;
  }
  function campoSelect(label, ruta, opciones) {
    var i = id();
    var el = $('<div class="campo"><label for="' + i + '">' + esc(label) + '</label><select id="' + i + '">' + opciones.map(function (o) { return '<option value="' + esc(o[0]) + '">' + esc(o[1]) + "</option>"; }).join("") + "</select></div>");
    var s = el.querySelector("select"); s.value = get(ruta) || ""; s.addEventListener("change", function () { set(ruta, s.value); });
    return el;
  }
  function campoCheck(label, ruta) {
    var i = id(), el = $('<div class="campo campo--check"><input type="checkbox" id="' + i + '"><label for="' + i + '">' + esc(label) + "</label></div>");
    var c = el.querySelector("input"); c.checked = !!get(ruta); c.addEventListener("change", function () { set(ruta, c.checked); });
    return el;
  }
  function vistaImg(img) {
    if (!img || !img.archivo) return "<span>Marcador de posición<br>(sin foto)</span>";
    return '<img src="' + esc(urls[img.archivo] || img.archivo) + '" alt="">';
  }
  // Editor de una imagen: subir/sustituir, quitar, texto alternativo y pie
  function campoImagen(label, ruta, carpeta, op) {
    op = op || {};
    if (!get(ruta)) set(ruta, imgVacia(op.ancho, op.alto));
    var img = get(ruta), fi = id();
    var el = $('<div class="campo"><span class="etq">' + esc(label) + '</span><div class="imagen"><div class="imagen__vista"></div><div>' +
      '<div class="imagen__botones"><label class="btn btn--mini" for="' + fi + '">' + (img.archivo ? "Sustituir foto" : "Subir foto") + '</label><input class="oculto-input" type="file" accept="image/*" id="' + fi + '">' +
      (img.archivo ? '<button type="button" class="btn btn--mini btn--peligro" data-quitar>Quitar foto</button>' : "") + "</div>" +
      '<p class="imagen__datos"></p></div></div></div>');
    var cuerpo = el.querySelector(".imagen > div:last-child");
    function pintar() {
      var im = get(ruta);
      el.querySelector(".imagen__vista").innerHTML = vistaImg(im);
      el.querySelector(".imagen__datos").textContent = im.archivo ? im.archivo + " · " + im.ancho + "×" + im.alto + " px" : "Sin foto · se mostrará un marcador de " + im.ancho + "×" + im.alto + " px";
    }
    pintar();
    cuerpo.appendChild(campo("Texto alternativo (describe la foto para lectores de pantalla y SEO)", ruta.concat("alt")));
    if (op.pie !== false) cuerpo.appendChild(campo("Pie de foto / crédito", ruta.concat("pie")));
    if (!img.archivo) {
      var f = $('<div class="fila"></div>');
      f.appendChild(campo("Ancho del marcador (px)", ruta.concat("ancho"), { tipo: "number", alCambiar: function (v, e, ini) { if (ini) return; set(ruta.concat("ancho"), +v || 1600); pintar(); } }));
      f.appendChild(campo("Alto del marcador (px)", ruta.concat("alto"), { tipo: "number", alCambiar: function (v, e, ini) { if (ini) return; set(ruta.concat("alto"), +v || 1067); pintar(); } }));
      cuerpo.appendChild(f);
    }
    el.querySelector("input[type=file]").addEventListener("change", function (e) {
      var file = e.target.files[0]; if (!file) return;
      estado("Optimizando foto…");
      procesarFoto(file, carpeta, op.base).then(function (r) {
        var im = get(ruta); set(ruta, Object.assign({}, im, r)); repintar();
      }).catch(function (err) { avisar(err.message, true); });
    });
    var q = el.querySelector("[data-quitar]");
    if (q) q.addEventListener("click", function () { var im = get(ruta); set(ruta, Object.assign({}, im, { archivo: "", movil: "" })); repintar(); });
    return el;
  }

  // Editor de listas genérico: añadir, quitar, subir/bajar y arrastrar
  function editorLista(titulo, ruta, pintarItem, nuevo, op) {
    op = op || {};
    var cont = $('<section><h2><span>' + esc(titulo) + '</span><span class="controles"></span></h2><div class="items"></div></section>');
    var items = cont.querySelector(".items"), lista = get(ruta) || [];
    if (!Array.isArray(get(ruta))) set(ruta, lista);
    var btnNuevo = $('<button type="button" class="btn btn--mini">+ ' + esc(op.etiquetaNuevo || "Añadir") + "</button>");
    btnNuevo.addEventListener("click", function () { get(ruta).push(nuevo()); cambiado(); repintar(); });
    cont.querySelector(".controles").appendChild(btnNuevo);
    if (op.extraCabecera) cont.querySelector(".controles").appendChild(op.extraCabecera());
    lista.forEach(function (item, i) {
      var caja = $('<div class="caja" draggable="true"><div class="caja__cabeza"><span class="asa" title="Arrastra para reordenar" aria-hidden="true">⠿</span><span class="num">' + String(i + 1).padStart(2, "0") + '</span><span class="mono">' + esc(op.nombreItem ? op.nombreItem(item, i) : "") + '</span><span class="controles">' +
        '<button type="button" class="btn btn--mini" data-a="arriba" aria-label="Subir"' + (i === 0 ? " disabled" : "") + '>↑</button><button type="button" class="btn btn--mini" data-a="abajo" aria-label="Bajar"' + (i === lista.length - 1 ? " disabled" : "") + '>↓</button><button type="button" class="btn btn--mini btn--peligro" data-a="quitar">Eliminar</button></span></div></div>');
      caja.appendChild(pintarItem(ruta.concat(i), item, i));
      caja.querySelector(".controles").addEventListener("click", function (e) {
        var a = e.target.getAttribute("data-a"); if (!a) return;
        var l = get(ruta);
        if (a === "quitar") { if (!confirm("¿Eliminar este elemento?")) return; l.splice(i, 1); }
        if (a === "arriba" && i > 0) l.splice(i - 1, 0, l.splice(i, 1)[0]);
        if (a === "abajo" && i < l.length - 1) l.splice(i + 1, 0, l.splice(i, 1)[0]);
        cambiado(); repintar();
      });
      arrastrable(caja, i, function (de, a) { var l = get(ruta); l.splice(a, 0, l.splice(de, 1)[0]); cambiado(); repintar(); });
      items.appendChild(caja);
    });
    if (!lista.length) items.appendChild($('<p class="ayuda">Vacío. Pulsa «+ ' + esc(op.etiquetaNuevo || "Añadir") + '».</p>'));
    return cont;
  }
  var arrastre = null;
  function arrastrable(el, i, mover) {
    el.addEventListener("dragstart", function (e) {
      if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && el.contains(document.activeElement)) { e.preventDefault(); return; }
      arrastre = { i: i, el: el, grupo: el.parentNode }; el.classList.add("caja--arrastrando"); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(i));
    });
    el.addEventListener("dragend", function () { el.classList.remove("caja--arrastrando"); arrastre = null; });
    el.addEventListener("dragover", function (e) { if (arrastre && arrastre.grupo === el.parentNode) { e.preventDefault(); el.classList.add("caja--sobre"); } });
    el.addEventListener("dragleave", function () { el.classList.remove("caja--sobre"); });
    el.addEventListener("drop", function (e) {
      el.classList.remove("caja--sobre");
      if (!arrastre || arrastre.grupo !== el.parentNode) return; e.preventDefault();
      if (arrastre.i !== i) mover(arrastre.i, i);
    });
  }

  /* ---------------- pestañas ---------------- */
  var PESTANAS = [
    ["general", "00", "General"], ["inicio", "01", "Portada"], ["sobre", "02", "Sobre mí"],
    ["categorias", "03", "Categorías"], ["proyectos", "03", "Proyectos"], ["contacto", "04", "Contacto"], ["publicar", "→", "Exportar"]
  ];
  function pintarPestanas() {
    var nav = document.getElementById("pestanas"); nav.innerHTML = "";
    PESTANAS.forEach(function (p) {
      var b = $('<button type="button"><span class="mono">' + p[1] + "</span>" + p[2] + "</button>");
      if (p[0] === pestana) b.setAttribute("aria-current", "true");
      b.addEventListener("click", function () { pestana = p[0]; proyectoAbierto = null; pintarPestanas(); repintar(true); });
      nav.appendChild(b);
    });
  }
  function repintar(arriba) {
    var y = window.scrollY;
    panel.innerHTML = "";
    ({ general: pGeneral, inicio: pInicio, sobre: pSobre, categorias: pCategorias, proyectos: pProyectos, contacto: pContacto, publicar: pPublicar })[pestana]();
    if (arriba) { window.scrollTo(0, 0); panel.focus({ preventScroll: true }); } else window.scrollTo(0, y);
  }
  function cabecera(t, intro) { panel.appendChild($("<h1>" + esc(t) + "</h1>")); if (intro) panel.appendChild($('<p class="intro">' + intro + "</p>")); }
  function seccion(t) { panel.appendChild($("<h2><span>" + esc(t) + "</span></h2>")); }

  function pGeneral() {
    cabecera("General", "Datos básicos de la web y textos para buscadores (SEO). Un texto entre corchetes, como <code>[Pendiente: …]</code>, se muestra en la web marcado como pendiente.");
    var f = $('<div class="fila"></div>'); f.appendChild(campo("Nombre", ["sitio", "nombre"])); f.appendChild(campo("Marca", ["sitio", "marca"])); f.appendChild(campo("Año (pie de página)", ["sitio", "anio"])); panel.appendChild(f);
    panel.appendChild(campo("Profesión", ["sitio", "profesion"]));
    panel.appendChild(campoLista("Especialidades", ["sitio", "especialidades"]));
    seccion("SEO");
    panel.appendChild(campo("Título para buscadores", ["sitio", "tituloSEO"], { ayuda: "Recomendado: menos de 60 caracteres." }));
    panel.appendChild(campo("Descripción para buscadores", ["sitio", "descripcionSEO"], { multilinea: true, ayuda: "Recomendado: 120–160 caracteres." }));
    panel.appendChild(campo("Dominio", ["sitio", "dominio"], { tipo: "url", ayuda: "Si cambias de dominio, cámbialo también en index.html (etiquetas canonical y og), robots.txt y sitemap.xml." }));
  }
  function pInicio() {
    cabecera("Portada", "La primera página de la web.");
    panel.appendChild(campo("Titular", ["inicio", "titular"], { ayuda: "Se compone en líneas de dos palabras con tus caras repetidas (1, 3 y 6) y la última palabra sola." }));
    panel.appendChild(campo("Presentación breve", ["inicio", "presentacion"], { multilinea: true }));
    panel.appendChild(campoLista("Pilares", ["inicio", "pilares"]));
    panel.appendChild(campoLista("Palabras de la cinta azul (se repiten en movimiento)", ["inicio", "cinta"]));
    panel.appendChild(campo("Texto del botón al archivo", ["inicio", "botonArchivo"]));
    seccion("Imagen o vídeo protagonista");
    panel.appendChild($('<p class="ayuda">Si pones un vídeo, se muestra el vídeo en lugar de la imagen.</p>'));
    panel.appendChild(campoImagen("Imagen protagonista", ["inicio", "imagenPortada"], "portada", { base: "portada", ancho: 1920, alto: 1080 }));
    panel.appendChild(campoVideo(["inicio", "videoPortada"], "portada"));
  }
  function pSobre() {
    cabecera("Sobre mí", "Tu presentación. No hay nada inventado: los textos entre corchetes son huecos para que los completes.");
    panel.appendChild(campo("Titular", ["sobreMi", "titular"]));
    panel.appendChild(campo("Entradilla (frase grande)", ["sobreMi", "entradilla"], { multilinea: true, filas: 2 }));
    panel.appendChild(campoLista("Texto de presentación", ["sobreMi", "texto"], { parrafos: true, filas: 6 }));
    panel.appendChild(campoImagen("Retrato", ["sobreMi", "retrato"], "sobre-mi", { base: "retrato", ancho: 1200, alto: 1500 }));
    panel.appendChild(editorLista("Pilares", ["sobreMi", "pilares"], function (r) { var d = $("<div></div>"); d.appendChild(campo("Nombre", r.concat("nombre"))); d.appendChild(campo("Texto", r.concat("texto"), { multilinea: true, filas: 2 })); return d; }, function () { return { nombre: "Nuevo pilar", texto: "" }; }, { etiquetaNuevo: "Añadir pilar" }));
    function cv(titulo, clave, extra, extraEt) {
      panel.appendChild(editorLista(titulo, ["sobreMi", clave], function (r) {
        var d = $('<div class="fila"></div>'); d.appendChild(campo("Año", r.concat("anio"))); d.appendChild(campo("Título", r.concat("titulo"))); d.appendChild(campo(extraEt, r.concat(extra))); return d;
      }, function () { var o = { anio: "", titulo: "" }; o[extra] = ""; return o; }, { etiquetaNuevo: "Añadir entrada" }));
    }
    cv("Formación", "formacion", "lugar", "Centro · ciudad");
    cv("Trayectoria", "trayectoria", "detalle", "Rol · cliente · lugar");
    seccion("Intereses, filosofía y colaboraciones");
    panel.appendChild(campoLista("Intereses e influencias", ["sobreMi", "intereses"]));
    panel.appendChild(campo("Filosofía creativa", ["sobreMi", "filosofia"], { multilinea: true, filas: 2 }));
    panel.appendChild(campoLista("Colaboraciones y créditos", ["sobreMi", "colaboraciones"]));
    panel.appendChild(editorLista("Fotos de proceso", ["sobreMi", "fotos"], function (r) { return campoImagen("Foto", r, "sobre-mi", { base: "proceso" }); }, function () { return imgVacia(1600, 1067); }, { etiquetaNuevo: "Añadir foto" }));
  }
  function pCategorias() {
    cabecera("Categorías", "Las secciones del archivo visual. El «identificador» se usa en la dirección (#/archivo/identificador); si lo cambias, los proyectos de esa categoría se actualizan solos.");
    panel.appendChild(editorLista("Categorías", ["categorias"], function (r, c) {
      var d = $("<div></div>"), anterior = c.id;
      var f = $('<div class="fila"></div>');
      f.appendChild(campo("Nombre", r.concat("nombre")));
      var cid = campo("Identificador", r.concat("id"), { ayuda: "Solo minúsculas, números y guiones." });
      cid.querySelector("input").addEventListener("change", function (e) {
        var nuevo = slug(e.target.value); e.target.value = nuevo; set(r.concat("id"), nuevo);
        (E.proyectos || []).forEach(function (p) { if (p.categoria === anterior) p.categoria = nuevo; }); anterior = nuevo; cambiado();
      });
      f.appendChild(cid); d.appendChild(f);
      d.appendChild(campo("Descripción", r.concat("descripcion"), { multilinea: true, filas: 2 }));
      d.appendChild(campoImagen("Foto de portada de la categoría", r.concat("portada"), "categorias", { base: c.id, pie: false, ancho: 1200, alto: 1500 }));
      var n = (E.proyectos || []).filter(function (p) { return p.categoria === c.id; }).length;
      d.appendChild($('<p class="ayuda">' + n + " proyecto(s) en esta categoría.</p>"));
      return d;
    }, function () { var n = (E.categorias || []).length + 1; return { id: "categoria-" + n, nombre: "NUEVA CATEGORÍA", descripcion: "", portada: imgVacia(1200, 1500) }; }, { etiquetaNuevo: "Añadir categoría", nombreItem: function (c) { return c.nombre; } }));
  }

  function nuevoProyecto() {
    var cat = (E.categorias && E.categorias[0] && E.categorias[0].id) || "";
    var base = "proyecto-" + Date.now().toString(36);
    return { id: base, categoria: cat, destacado: false, formato: "mediano", titulo: "Nuevo proyecto", fecha: "", lugar: "", rol: "", resumen: "", descripcion: [], portada: imgVacia(1600, 1067), galeria: [], videos: [], creditos: [], enlaces: [] };
  }
  function pProyectos() {
    if (proyectoAbierto != null && E.proyectos[proyectoAbierto]) return pProyecto(proyectoAbierto);
    cabecera("Proyectos", "El archivo visual. El orden de esta lista es el orden de la web y su numeración (001, 002…). Arrastra las filas o usa las flechas para reorganizar.");
    var h = $('<h2><span>' + (E.proyectos || []).length + ' proyectos</span><span class="controles"></span></h2>');
    var bn = $('<button type="button" class="btn btn--azul btn--mini">+ Nuevo proyecto</button>');
    bn.addEventListener("click", function () { E.proyectos.unshift(nuevoProyecto()); cambiado(); proyectoAbierto = 0; repintar(true); });
    h.querySelector(".controles").appendChild(bn); panel.appendChild(h);
    var t = $('<div class="tabla-proyectos"></div>');
    (E.proyectos || []).forEach(function (p, i) {
      var cat = (E.categorias || []).filter(function (c) { return c.id === p.categoria; })[0];
      var fila = $('<div class="fp" draggable="true"><span class="asa" aria-hidden="true">⠿</span><span class="num">' + num(i + 1) + '</span><span class="mini">' + (p.portada && p.portada.archivo ? '<img src="' + esc(urls[p.portada.archivo] || p.portada.archivo) + '" alt="">' : "<span>SIN FOTO</span>") + "</span>" +
        "<span><strong>" + esc(p.titulo) + "</strong>" + (p.destacado ? ' <span class="destacado mono">★ en portada</span>' : "") + '<br><span class="mono">' + esc(p.fecha || "") + " · " + (p.galeria || []).length + " fotos · " + (p.videos || []).length + ' vídeos</span></span><span class="mono cat">' + (cat ? esc(cat.nombre) : '<span style="color:#b00020">Sin categoría</span>') + '</span><span class="controles">' +
        '<button type="button" class="btn btn--mini" data-a="arriba"' + (i === 0 ? " disabled" : "") + ' aria-label="Subir">↑</button><button type="button" class="btn btn--mini" data-a="abajo"' + (i === E.proyectos.length - 1 ? " disabled" : "") + ' aria-label="Bajar">↓</button>' +
        '<button type="button" class="btn btn--mini btn--azul" data-a="editar">Editar</button><button type="button" class="btn btn--mini" data-a="duplicar">Duplicar</button><button type="button" class="btn btn--mini btn--peligro" data-a="quitar">Eliminar</button></span></div>');
      fila.querySelector(".controles").addEventListener("click", function (e) {
        var a = e.target.getAttribute("data-a"), l = E.proyectos; if (!a) return;
        if (a === "editar") { proyectoAbierto = i; return repintar(true); }
        if (a === "quitar") { if (!confirm("¿Eliminar «" + p.titulo + "»? Sus fotos dejarán de mostrarse en la web.")) return; l.splice(i, 1); }
        if (a === "duplicar") { var c = JSON.parse(JSON.stringify(p)); c.id = p.id + "-copia-" + Date.now().toString(36).slice(-3); c.titulo = p.titulo + " (copia)"; l.splice(i + 1, 0, c); }
        if (a === "arriba" && i > 0) l.splice(i - 1, 0, l.splice(i, 1)[0]);
        if (a === "abajo" && i < l.length - 1) l.splice(i + 1, 0, l.splice(i, 1)[0]);
        cambiado(); repintar();
      });
      arrastrable(fila, i, function (de, a) { E.proyectos.splice(a, 0, E.proyectos.splice(de, 1)[0]); cambiado(); repintar(); });
      t.appendChild(fila);
    });
    panel.appendChild(t);
  }
  function pProyecto(i) {
    var r = ["proyectos", i], p = E.proyectos[i];
    var volver = $('<p><button type="button" class="btn btn--mini">← Volver a la lista</button></p>');
    volver.querySelector("button").addEventListener("click", function () { proyectoAbierto = null; repintar(true); });
    panel.appendChild(volver);
    cabecera("Nº " + num(i + 1) + " · " + (p.titulo || "Proyecto"));
    var ver = $('<p class="intro"><a href="index.html?vista-previa#/proyecto/' + encodeURIComponent(p.id) + '" target="_blank" rel="noopener">Ver este proyecto en la vista previa ↗</a></p>');
    ver.querySelector("a").addEventListener("click", guardarBorrador);
    panel.appendChild(ver);
    panel.appendChild(campo("Título", r.concat("titulo")));
    var f = $('<div class="fila"></div>');
    f.appendChild(campoSelect("Categoría", r.concat("categoria"), (E.categorias || []).map(function (c) { return [c.id, c.nombre]; })));
    f.appendChild(campoSelect("Tamaño en la retícula del archivo", r.concat("formato"), [["grande", "Grande"], ["mediano", "Mediano"], ["pequeno", "Pequeño"], ["ancho", "Ancho completo"]]));
    panel.appendChild(f);
    var idc = campo("Dirección del proyecto (identificador)", r.concat("id"), { ayuda: "Aparece en el enlace: #/proyecto/identificador. Solo minúsculas, números y guiones." });
    idc.querySelector("input").addEventListener("change", function (e) {
      var v = slug(e.target.value), usado = E.proyectos.some(function (q, k) { return k !== i && q.id === v; });
      if (usado) { v = v + "-" + Date.now().toString(36).slice(-3); avisar("Ese identificador ya existía; se ha añadido un sufijo."); }
      e.target.value = v; set(r.concat("id"), v);
    });
    var sug = $('<button type="button" class="btn btn--mini">Generar desde el título</button>');
    sug.addEventListener("click", function () { var inp = idc.querySelector("input"); inp.value = slug(p.titulo); inp.dispatchEvent(new Event("change")); });
    idc.appendChild(sug);
    panel.appendChild(idc);
    panel.appendChild(campoCheck("Mostrar en la selección de la portada", r.concat("destacado")));
    var f2 = $('<div class="fila"></div>'); f2.appendChild(campo("Fecha", r.concat("fecha"))); f2.appendChild(campo("Lugar", r.concat("lugar"))); f2.appendChild(campo("Tu rol", r.concat("rol"))); panel.appendChild(f2);
    panel.appendChild(campo("Resumen (una línea, aparece en el archivo)", r.concat("resumen")));
    panel.appendChild(campoLista("Descripción", r.concat("descripcion"), { parrafos: true, filas: 6 }));
    seccion("Portada del proyecto");
    panel.appendChild(campoImagen("Foto de portada", r.concat("portada"), "proyectos", { base: p.id, pie: false }));

    // Galería con subida múltiple
    var mf = id();
    var subir = $('<span><label class="btn btn--mini btn--azul" for="' + mf + '">Subir varias fotos</label><input class="oculto-input" id="' + mf + '" type="file" accept="image/*" multiple></span>');
    subir.querySelector("input").addEventListener("change", function (e) {
      var files = Array.prototype.slice.call(e.target.files); if (!files.length) return;
      estado("Optimizando " + files.length + " foto(s)…");
      files.reduce(function (pr, file) {
        return pr.then(function () { return procesarFoto(file, "proyectos", p.id).then(function (o) { p.galeria.push(Object.assign({ alt: "", pie: "" }, o)); }); });
      }, Promise.resolve()).then(function () { cambiado(); repintar(); avisar(files.length + " foto(s) añadidas a la galería."); }).catch(function (err) { avisar(err.message, true); cambiado(); repintar(); });
    });
    panel.appendChild(editorLista("Galería", r.concat("galeria"), function (rr) { return campoImagen("Foto", rr, "proyectos", { base: p.id }); }, function () { return imgVacia(1600, 1067); }, { etiquetaNuevo: "Añadir hueco", extraCabecera: function () { return subir; } }));

    panel.appendChild(editorLista("Vídeos", r.concat("videos"), function (rr) { return campoVideo(rr, "proyectos", true); }, function () { return { url: "", titulo: "" }; }, { etiquetaNuevo: "Añadir vídeo" }));
    panel.appendChild(editorLista("Créditos", r.concat("creditos"), function (rr) { var d = $('<div class="fila"></div>'); d.appendChild(campo("Rol", rr.concat("rol"))); d.appendChild(campo("Nombre", rr.concat("nombre"))); return d; }, function () { return { rol: "", nombre: "" }; }, { etiquetaNuevo: "Añadir crédito" }));
    panel.appendChild(editorLista("Enlaces externos", r.concat("enlaces"), function (rr) { var d = $('<div class="fila"></div>'); d.appendChild(campo("Texto", rr.concat("texto"))); d.appendChild(campo("URL", rr.concat("url"), { tipo: "url", placeholder: "https://" })); return d; }, function () { return { texto: "", url: "" }; }, { etiquetaNuevo: "Añadir enlace" }));
  }
  function tipoVideo(url) {
    if (!url) return ["", ""];
    if (/(youtube\.com\/(watch\?(.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)[\w-]{11}/.test(url)) return ["ok", "✓ YouTube reconocido. Se cargará al pulsar, sin reproducción automática."];
    if (/vimeo\.com\/(video\/)?\d+/.test(url)) return ["ok", "✓ Vimeo reconocido. Se cargará al pulsar, sin reproducción automática."];
    if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)) return ["ok", "✓ Archivo de vídeo propio. Se mostrará con controles, sin reproducción automática."];
    return ["mal", "No es un enlace de YouTube, Vimeo ni un archivo de vídeo: se mostrará como botón «Ver vídeo»."];
  }
  function campoVideo(r, carpeta, conTitulo) {
    if (!get(r)) set(r, { url: "", titulo: "" });
    var d = $("<div></div>");
    d.appendChild(campo("Enlace del vídeo (YouTube, Vimeo o .mp4)", r.concat("url"), { tipo: "url", placeholder: "https://www.youtube.com/watch?v=… o https://vimeo.com/…",
      ayuda: " ", alCambiar: function (v, el) { var t = tipoVideo(v.trim()), a = el.querySelector(".ayuda"); a.className = "ayuda " + t[0]; a.textContent = t[1] || "Déjalo vacío para mostrar un marcador de vídeo."; } }));
    if (conTitulo !== false) d.appendChild(campo("Título del vídeo", r.concat("titulo")));
    var fi = id(), up = $('<p class="ayuda">¿Vídeo propio corto? <label for="' + fi + '" style="text-decoration:underline;cursor:pointer">Sube un archivo .mp4/.webm</label> (para vídeos largos es mejor YouTube o Vimeo).<input class="oculto-input" id="' + fi + '" type="file" accept="video/mp4,video/webm"></p>');
    up.querySelector("input").addEventListener("change", function (e) {
      var file = e.target.files[0]; if (!file) return;
      if (file.size > 60 * 1024 * 1024 && !confirm("El vídeo pesa " + Math.round(file.size / 1048576) + " MB y hará la web más lenta. ¿Continuar?")) return;
      procesarVideoArchivo(file, carpeta).then(function (ruta) { set(r.concat("url"), ruta); repintar(); avisar("Vídeo añadido: " + ruta); });
    });
    d.appendChild(up);
    return d;
  }
  function pContacto() {
    cabecera("Contacto", "Datos de contacto. Se actualizan en la página de contacto y en el pie de toda la web.");
    panel.appendChild(campo("Titular", ["contacto", "titular"]));
    panel.appendChild(campo("Frase de bienvenida", ["contacto", "bienvenida"], { multilinea: true, filas: 2 }));
    var f = $('<div class="fila"></div>');
    f.appendChild(campo("Email", ["contacto", "email"], { tipo: "email" }));
    f.appendChild(campo("Teléfono", ["contacto", "telefono"]));
    f.appendChild(campo("Instagram (sin @)", ["contacto", "instagram"]));
    f.appendChild(campo("Ubicación", ["contacto", "ubicacion"]));
    f.appendChild(campo("Vimeo (URL, opcional)", ["contacto", "vimeo"], { tipo: "url" }));
    f.appendChild(campo("YouTube (URL, opcional)", ["contacto", "youtube"], { tipo: "url" }));
    panel.appendChild(f);
    seccion("Formulario");
    panel.appendChild($('<div class="nota"><p><strong>Cómo funciona ahora:</strong> sin dirección de envío, el formulario abre la aplicación de correo de quien escribe con el mensaje ya preparado para tu email.</p><p><strong>Para recibir los mensajes sin que se abra el correo:</strong> crea un formulario gratuito en un servicio como Formspree (formspree.io), copia su dirección (algo como <code>https://formspree.io/f/xxxxabcd</code>) y pégala aquí.</p></div>'));
    panel.appendChild(campo("Dirección de envío del formulario (opcional)", ["contacto", "formulario", "endpoint"], { tipo: "url", placeholder: "https://formspree.io/f/…" }));
    panel.appendChild(campoLista("Tipos de proyecto del desplegable", ["contacto", "formulario", "tipos"]));
  }

  /* ---------------- exportar ---------------- */
  var CABECERA_JS = "/* =====================================================================\n   ISAENMISA · CONTENIDO DE LA WEB\n   Generado con el editor (admin.html) el " + "%FECHA%" + ".\n   Puedes seguir editándolo con admin.html o a mano (respeta comillas y comas).\n   - Textos entre corchetes \"[Pendiente: …]\" se muestran como pendientes.\n   - Imágenes: { archivo, movil, ancho, alto, alt, pie }. Sin \"archivo\" se\n     dibuja un marcador de posición.\n   - Vídeos: { url, titulo } -> YouTube, Vimeo o archivo .mp4/.webm\n   ===================================================================== */\n\n";
  function generarJS() {
    return CABECERA_JS.replace("%FECHA%", new Date().toLocaleString("es-ES")) + "window.CONTENIDO = " + JSON.stringify(E, null, 2) + ";\n";
  }
  function archivosAExportar() {
    var usadas = rutasUsadas();
    return todosBlobs().then(function (blobs) {
      var lista = [{ ruta: "contenido/contenido.js", blob: new Blob([generarJS()], { type: "text/javascript" }) }];
      Object.keys(blobs).forEach(function (k) { if (usadas[k]) lista.push({ ruta: k, blob: blobs[k] }); });
      return lista;
    });
  }
  function descargar(blob, nombre) {
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nombre; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  // ZIP sin compresión (las fotos ya van comprimidas en WebP)
  var tablaCRC = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = tablaCRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function crearZip(archivos) {
    return Promise.all(archivos.map(function (f) { return f.blob.arrayBuffer().then(function (b) { return { ruta: f.ruta, datos: new Uint8Array(b) }; }); })).then(function (fs) {
      var enc = new TextEncoder(), partes = [], central = [], offset = 0, d = new Date();
      var hora = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), fecha = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
      fs.forEach(function (f) {
        var nombre = enc.encode(f.ruta), crc = crc32(f.datos), n = f.datos.length;
        var lh = new DataView(new ArrayBuffer(30));
        lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
        lh.setUint16(10, hora, true); lh.setUint16(12, fecha, true); lh.setUint32(14, crc, true); lh.setUint32(18, n, true); lh.setUint32(22, n, true);
        lh.setUint16(26, nombre.length, true); lh.setUint16(28, 0, true);
        partes.push(lh.buffer, nombre, f.datos);
        var ch = new DataView(new ArrayBuffer(46));
        ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
        ch.setUint16(12, hora, true); ch.setUint16(14, fecha, true); ch.setUint32(16, crc, true); ch.setUint32(20, n, true); ch.setUint32(24, n, true);
        ch.setUint16(28, nombre.length, true); ch.setUint32(42, offset, true);
        central.push(ch.buffer, nombre);
        offset += 30 + nombre.length + n;
      });
      var tamCentral = central.reduce(function (s, p) { return s + (p.byteLength || p.length); }, 0);
      var fin = new DataView(new ArrayBuffer(22));
      fin.setUint32(0, 0x06054b50, true); fin.setUint16(8, fs.length, true); fin.setUint16(10, fs.length, true); fin.setUint32(12, tamCentral, true); fin.setUint32(16, offset, true);
      return new Blob(partes.concat(central, [fin.buffer]), { type: "application/zip" });
    });
  }
  function guardarEnCarpeta() {
    if (!window.showDirectoryPicker) return avisar("Tu navegador no permite guardar en carpetas. Usa «Descargar .zip».", true);
    var dir;
    window.showDirectoryPicker({ mode: "readwrite", id: "isaenmisa-web" }).then(function (d) {
      dir = d; return dir.getFileHandle("index.html").catch(function () { throw new Error("Esa carpeta no contiene index.html. Elige la carpeta principal de la web."); });
    }).then(function () { return archivosAExportar(); }).then(function (archivos) {
      return archivos.reduce(function (pr, f) {
        return pr.then(function () {
          var partes = f.ruta.split("/"), nombre = partes.pop();
          return partes.reduce(function (p2, sub) { return p2.then(function (h) { return h.getDirectoryHandle(sub, { create: true }); }); }, Promise.resolve(dir))
            .then(function (h) { return h.getFileHandle(nombre, { create: true }); })
            .then(function (fh) { return fh.createWritable(); })
            .then(function (w) { return w.write(f.blob).then(function () { return w.close(); }); });
        });
      }, Promise.resolve()).then(function () { return archivos.length; });
    }).then(function (n) {
      avisar("Guardado en la carpeta: " + n + " archivo(s). Ya puedes subir la carpeta a tu alojamiento.");
      estado("Cambios guardados en la carpeta de la web · " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }));
    }).catch(function (err) { if (err && err.name === "AbortError") return; avisar((err && err.message) || "No se pudo guardar.", true); });
  }
  function importar(file) {
    file.text().then(function (txt) {
      var i = txt.indexOf("window.CONTENIDO"); if (i < 0) throw new Error("El archivo no parece un contenido.js válido.");
      var json = txt.slice(txt.indexOf("{", i), txt.lastIndexOf("}") + 1);
      E = JSON.parse(json); cambiado(); repintar(); avisar("Contenido importado.");
    }).catch(function (err) { avisar(err.message || "No se pudo leer el archivo.", true); });
  }
  function pPublicar() {
    cabecera("Exportar cambios", "Tus cambios están guardados como borrador en este navegador. Para que aparezcan en la web publicada hay que guardarlos en los archivos de la web y subirlos a tu alojamiento.");
    var resumen = $('<div class="nota"><p>Calculando cambios…</p></div>'); panel.appendChild(resumen);
    archivosAExportar().then(function (a) {
      var fotos = a.length - 1;
      resumen.innerHTML = "<p><strong>Se exportarán " + a.length + " archivo(s):</strong> contenido/contenido.js" + (fotos ? " y " + fotos + " foto(s)/vídeo(s) nuevos" : "") + ".</p>";
      var ul = $('<ul class="lista-cambios"></ul>'); a.forEach(function (f) { ul.appendChild($("<li>" + esc(f.ruta) + " · " + Math.max(1, Math.round(f.blob.size / 1024)) + " KB</li>")); }); resumen.appendChild(ul);
    });
    var op = $('<div class="opciones-publicar"></div>');
    var c1 = $('<div class="caja"><h3>1 · Guardar en la carpeta de la web</h3><p>Escribe directamente los archivos en la carpeta de tu web (la que contiene index.html). Funciona en Chrome o Edge de ordenador.</p><button type="button" class="btn btn--azul">Elegir carpeta y guardar</button></div>');
    c1.querySelector("button").addEventListener("click", guardarEnCarpeta);
    if (!window.showDirectoryPicker) { c1.querySelector("button").disabled = true; c1.querySelector("p").insertAdjacentHTML("beforeend", " <strong>No disponible en este navegador.</strong>"); }
    var c2 = $('<div class="caja"><h3>2 · Descargar paquete .zip</h3><p>Descarga un .zip con la misma estructura de carpetas. Descomprímelo encima de la carpeta de la web (reemplazando) y súbela.</p><button type="button" class="btn">Descargar .zip</button></div>');
    c2.querySelector("button").addEventListener("click", function () {
      archivosAExportar().then(crearZip).then(function (z) { descargar(z, "isaenmisa-actualizacion-" + new Date().toISOString().slice(0, 10) + ".zip"); avisar("Paquete descargado."); });
    });
    var c3 = $('<div class="caja"><h3>3 · Solo el texto</h3><p>Si solo has cambiado textos (sin fotos nuevas), basta con sustituir <code>contenido/contenido.js</code>.</p><button type="button" class="btn">Descargar contenido.js</button></div>');
    c3.querySelector("button").addEventListener("click", function () { descargar(new Blob([generarJS()], { type: "text/javascript" }), "contenido.js"); });
    op.appendChild(c1); op.appendChild(c2); op.appendChild(c3); panel.appendChild(op);

    seccion("Borrador");
    var fi = id(), c4 = $('<div class="opciones-publicar"><div class="caja"><h3>Importar contenido.js</h3><p>Carga un contenido.js guardado antes (por ejemplo, desde otro ordenador).</p><label class="btn" for="' + fi + '">Elegir archivo</label><input class="oculto-input" id="' + fi + '" type="file" accept=".js,text/javascript"></div>' +
      '<div class="caja"><h3>Descartar borrador</h3><p>Vuelve al contenido publicado actualmente y borra los cambios y fotos sin exportar de este navegador.</p><button type="button" class="btn btn--peligro">Descartar todo</button></div></div>');
    c4.querySelector("input").addEventListener("change", function (e) { if (e.target.files[0]) importar(e.target.files[0]); });
    c4.querySelector(".btn--peligro").addEventListener("click", function () {
      if (!confirm("Se perderán los cambios y las fotos que no hayas exportado. ¿Descartar?")) return;
      localStorage.removeItem(CLAVE); localStorage.removeItem(CLAVE + "-hora");
      idb("readwrite", function (st) { st.clear(); }).catch(function () {});
      E = JSON.parse(JSON.stringify(publicado)); urls = {}; estado("Sin cambios · contenido publicado"); repintar(); avisar("Borrador descartado.");
    });
    panel.appendChild(c4);
    panel.appendChild($('<div class="nota" style="margin-top:1rem"><p><strong>Seguridad:</strong> este editor no puede cambiar la web publicada por sí solo; trabaja únicamente en el navegador de quien lo abre. Aunque alguien abriera admin.html en tu web, no podría modificarla.</p></div>'));
  }

  /* ---------------- arranque ---------------- */
  document.getElementById("btn-vista").addEventListener("click", function () { clearTimeout(tGuardar); guardarBorrador(); window.open("index.html?vista-previa", "_blank"); });
  document.getElementById("btn-publicar").addEventListener("click", function () { pestana = "publicar"; proyectoAbierto = null; pintarPestanas(); repintar(true); });

  function iniciar() {
    var b = null; try { b = localStorage.getItem(CLAVE); } catch (e) { /* sin acceso */ }
    E = JSON.parse(JSON.stringify(publicado));
    if (b && b !== JSON.stringify(publicado)) {
      var h = localStorage.getItem(CLAVE + "-hora");
      if (confirm("Hay un borrador sin exportar" + (h ? " del " + new Date(h).toLocaleString("es-ES") : "") + ".\n\nAceptar: seguir con el borrador.\nCancelar: empezar desde el contenido publicado (el borrador se sustituirá al editar).")) {
        try { E = JSON.parse(b); } catch (e) { /* borrador dañado */ }
        estado("Borrador recuperado · sin exportar");
      } else estado("Contenido publicado · sin cambios");
    } else estado("Contenido publicado · sin cambios");
    todosBlobs().then(function (bl) { Object.keys(bl).forEach(function (k) { urls[k] = URL.createObjectURL(bl[k]); }); pintarPestanas(); repintar(true); });
  }
  if (!window.CONTENIDO) { panel.innerHTML = "<p>No se encontró contenido/contenido.js junto a admin.html.</p>"; return; }
  window.addEventListener("beforeunload", function () { clearTimeout(tGuardar); if (E) try { localStorage.setItem(CLAVE, JSON.stringify(E)); } catch (e) { /* nada */ } });
  iniciar();
})();
