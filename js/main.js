const preguntas = [
  { tipo: "radio", texto: "¿Qué significa HTML?", opciones: ["Lenguaje de marcado de hipertexto", "Lenguaje para hojas de cálculo", "Herramienta de hosting", "Protocolo de transferencia"], correcta: 0 },
  { tipo: "checkbox", texto: "Selecciona los lenguajes que usa una página en el navegador:", opciones: ["HTML", "CSS", "JavaScript", "Photoshop"], correcta: [0, 1, 2] },
  { tipo: "menu", texto: "¿Qué atributo indica el destino de un enlace &lt;a&gt;?", opciones: ["src", "href", "alt", "title"], correcta: 1 },
  { tipo: "radio", texto: "JavaScript puede validar un formulario antes de enviarlo.", opciones: ["Verdadero", "Falso"], correcta: 0 },
  { tipo: "lista", texto: "¿Qué propiedad de CSS cambia el color del texto?", opciones: ["background", "color", "font-size", "border"], correcta: 1 },
  { tipo: "texto", texto: "Escribe la extensión de un archivo de estilos (sin punto):", correcta: "css" },
  { tipo: "checkbox", texto: "¿Cuáles sirven para publicar un sitio estático?", opciones: ["GitHub Pages", "Netlify", "Microsoft Excel", "Calculadora"], correcta: [0, 1] }
];

function leer(clave) {
  try {
    return JSON.parse(localStorage.getItem(clave)) || [];
  } catch (e) {
    return [];
  }
}

function guardar(clave, valor) {
  localStorage.setItem(clave, JSON.stringify(valor));
}

function limpio(t) {
  return String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function iniciarBase() {
  const lista = leer("usuarios");
  if (!lista.some(u => u.usuario === "admin")) {
    lista.push({ nombre: "Administrador", correo: "admin@programador.edu", telefono: "00000000", usuario: "admin", clave: "2026", fecha: "—" });
    guardar("usuarios", lista);
  }
}

function datosHtml(u) {
  return "<dl><dt>Nombre</dt><dd>" + limpio(u.nombre) + "</dd><dt>Correo</dt><dd>" + limpio(u.correo) +
    "</dd><dt>Teléfono</dt><dd>" + limpio(u.telefono) + "</dd><dt>Usuario</dt><dd>" + limpio(u.usuario) +
    "</dd><dt>Registro</dt><dd>" + limpio(u.fecha) + "</dd></dl>";
}

function paginaInicio() {
  const registro = document.getElementById("formRegistro");
  const ingreso = document.getElementById("formIngreso");

  registro.addEventListener("submit", function (e) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(registro));
    d.usuario = d.usuario.trim();
    const lista = leer("usuarios");
    let error = "";
    if (d.nombre.trim().length < 3) error = "Escribe tu nombre completo.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.correo)) error = "El correo no tiene un formato válido.";
    else if (!/^\d{8}$/.test(d.telefono)) error = "El teléfono debe tener 8 dígitos.";
    else if (d.usuario.length < 4) error = "El usuario necesita al menos 4 caracteres.";
    else if (lista.some(u => u.usuario === d.usuario)) error = "Ese usuario ya existe, elige otro.";
    else if (d.clave.length < 4) error = "La contraseña necesita al menos 4 caracteres.";
    document.getElementById("avisoRegistro").textContent = error;
    if (error) return;
    d.fecha = new Date().toLocaleDateString("es-GT");
    lista.push(d);
    guardar("usuarios", lista);
    sessionStorage.setItem("sesion", d.usuario);
    document.getElementById("resumenDatos").innerHTML = datosHtml(d);
    document.getElementById("registro").hidden = true;
    document.getElementById("resumen").hidden = false;
    window.scrollTo(0, 0);
  });

  ingreso.addEventListener("submit", function (e) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(ingreso));
    const existe = leer("usuarios").find(u => u.usuario === d.usuario.trim() && u.clave === d.clave);
    if (!existe) {
      document.getElementById("avisoIngreso").textContent = "Usuario o contraseña incorrectos.";
      return;
    }
    sessionStorage.setItem("sesion", existe.usuario);
    location.href = "curso.html";
  });
}

function dibujarPreguntas() {
  const caja = document.getElementById("listaPreguntas");
  preguntas.forEach(function (p, i) {
    let campo;
    if (p.tipo === "radio" || p.tipo === "checkbox") {
      campo = p.opciones.map((op, j) => '<label class="opcion"><input type="' + p.tipo + '" name="p' + i + '" value="' + j + '"> ' + op + "</label>").join("");
    } else if (p.tipo === "menu" || p.tipo === "lista") {
      const vacio = p.tipo === "menu" ? '<option value="">Elige una opción</option>' : "";
      const filas = p.tipo === "lista" ? ' size="4"' : "";
      campo = '<select name="p' + i + '"' + filas + ">" + vacio + p.opciones.map((op, j) => '<option value="' + j + '">' + op + "</option>").join("") + "</select>";
    } else {
      campo = '<input type="text" name="p' + i + '" autocomplete="off">';
    }
    caja.innerHTML += '<fieldset class="pregunta"><legend>' + (i + 1) + ". " + p.texto + "</legend>" + campo + "</fieldset>";
  });
}

function esCorrecta(p, r) {
  if (p.tipo === "checkbox") return r.length === p.correcta.length && p.correcta.every(c => r.includes(c));
  return r === String(p.correcta).toLowerCase();
}

function dibujarAdmin() {
  const evaluaciones = leer("evaluaciones");
  const filas = leer("usuarios").filter(u => u.usuario !== "admin").map(function (u) {
    const mias = evaluaciones.filter(x => x.usuario === u.usuario);
    const mejor = mias.length ? Math.max(...mias.map(x => x.nota)) : "—";
    return "<tr><td>" + limpio(u.nombre) + "</td><td>" + limpio(u.correo) + "</td><td>" + mias.length + "</td><td>" + mejor + "</td></tr>";
  });
  document.getElementById("tablaAdmin").innerHTML = filas.join("") || '<tr><td colspan="4">Todavía no hay estudiantes registrados.</td></tr>';
  document.getElementById("panelAdmin").hidden = false;
}

function calificar(yo) {
  const form = document.getElementById("formExamen");
  const respuestas = [];
  let aciertos = 0;
  preguntas.forEach(function (p, i) {
    let r;
    if (p.tipo === "checkbox") {
      r = Array.from(form.querySelectorAll('input[name="p' + i + '"]:checked')).map(c => Number(c.value));
    } else {
      r = form.elements["p" + i].value.trim().toLowerCase();
    }
    respuestas.push(r);
    if (esCorrecta(p, r)) aciertos++;
  });
  const nota = Math.round(aciertos * 100 / preguntas.length);
  const lista = leer("evaluaciones");
  lista.push({ usuario: yo.usuario, nota: nota, aciertos: aciertos, total: preguntas.length, respuestas: respuestas, fecha: new Date().toLocaleString("es-GT") });
  guardar("evaluaciones", lista);

  const aprobado = nota >= 70;
  document.getElementById("resultado").hidden = false;
  document.getElementById("textoNota").textContent = "Tu calificación es " + nota + " de 100 (" + aciertos + " de " + preguntas.length + " respuestas correctas).";
  document.getElementById("estadoNota").textContent = aprobado ? "Aprobaste el curso." : "Necesitas 70 para aprobar. Repasa los módulos e inténtalo otra vez.";
  document.getElementById("diploma").hidden = !aprobado;
  document.getElementById("imprimir").hidden = !aprobado;
  if (aprobado) {
    document.getElementById("dipNombre").textContent = yo.nombre;
    document.getElementById("dipNota").textContent = nota + "/100";
    document.getElementById("dipFecha").textContent = new Date().toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" });
  }
  document.getElementById("resultado").scrollIntoView();
}

function paginaCurso() {
  const yo = leer("usuarios").find(u => u.usuario === sessionStorage.getItem("sesion"));
  if (!yo) {
    location.href = "index.html";
    return;
  }
  document.getElementById("saludo").textContent = yo.nombre;
  document.getElementById("misDatos").innerHTML = datosHtml(yo);
  document.getElementById("salir").addEventListener("click", function () {
    sessionStorage.removeItem("sesion");
    location.href = "index.html";
  });
  document.getElementById("imprimir").addEventListener("click", () => window.print());
  if (yo.usuario === "admin") dibujarAdmin();
  dibujarPreguntas();
  document.getElementById("formExamen").addEventListener("submit", function (e) {
    e.preventDefault();
    calificar(yo);
  });
}

iniciarBase();
if (document.body.dataset.pagina === "inicio") paginaInicio();
else paginaCurso();
