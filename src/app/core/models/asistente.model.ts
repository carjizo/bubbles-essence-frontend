export interface PreguntaChat {
  pregunta: string;
}

export interface RespuestaChat {
  respuesta: string;
}

/** Mensaje tal como se muestra en la UI del chat (no viaja así al backend). */
export interface MensajeChat {
  autor: 'usuario' | 'asistente';
  texto: string;
}