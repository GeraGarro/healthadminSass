"use strict";

/**
 * Mejoras opcionales para una documentación que ya funciona como HTML estático.
 * Este archivo se carga con `defer`: el DOM existe antes de inicializarlo.
 * No genera fichas, no consulta servicios ni guarda datos en el navegador.
 */

/**
 * Abre el diálogo de impresión del navegador mediante una acción del usuario.
 * La presentación impresa se define exclusivamente en el bloque @media print
 * de casos-de-uso.css; esta función no modifica el contenido del documento.
 * @returns {void}
 */
function imprimirDocumento() {
  window.print();
}

/**
 * Marca en el índice el enlace cuyo destino coincide con el fragmento de la URL.
 * Usa aria-current para comunicar la ubicación a tecnologías de asistencia y
 * permitir su resaltado mediante CSS. Si no hay coincidencia, deja el índice
 * sin selección. No mueve el foco ni interfiere con la navegación del navegador.
 * @returns {void}
 */
function actualizarEnlaceActivo() {
  const enlaces = document.querySelectorAll('.toc a[href^="#"]');
  const fragmentoActual = window.location.hash;

  for (const enlace of enlaces) {
    if (fragmentoActual && enlace.hash === fragmentoActual) {
      enlace.setAttribute("aria-current", "location");
    } else {
      enlace.removeAttribute("aria-current");
    }
  }
}

/**
 * Activa las mejoras de lectura una vez que el documento está disponible.
 * Muestra el botón de impresión solo cuando existe JavaScript, conecta su acción
 * y mantiene el índice actualizado al usar enlaces, URL directa o atrás/adelante.
 * Comprueba la existencia del botón para tolerar cambios futuros en la plantilla.
 * @returns {void}
 */
function inicializarDocumento() {
  const botonImprimir = document.getElementById("imprimir-documento");

  if (botonImprimir) {
    botonImprimir.addEventListener("click", imprimirDocumento);
    botonImprimir.hidden = false;
  }

  window.addEventListener("hashchange", actualizarEnlaceActivo);
  actualizarEnlaceActivo();
}

inicializarDocumento();
