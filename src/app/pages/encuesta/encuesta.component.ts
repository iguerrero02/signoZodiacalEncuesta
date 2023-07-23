import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

interface Pregunta {
  id: number;
  idString: string; // Nueva propiedad para el id como cadena
  nombre: string;
  texto: string;
  opciones: string[];
  respuesta?: string;
  respuestaLibre?:string;
}

@Component({
  selector: 'app-encuesta',
  templateUrl: './encuesta.component.html',
  styleUrls: ['./encuesta.component.scss']
})
export class EncuestaComponent {
  preguntas: Pregunta[] = [];
  preguntaSeleccionada: Pregunta | null = null;

  constructor(private http: HttpClient, private snackBar: MatSnackBar) {
    this.obtenerPreguntas();
    this.inicializarRespuestasLibres(); // Llama a la función para inicializar las respuestas libres
  }
  inicializarRespuestasLibres() {
    // Inicializa respuestaLibre para cada pregunta
    this.preguntas.forEach(pregunta => {
      pregunta.respuestaLibre = '';
    });
  }
  obtenerPreguntas() {
    this.http.get<Pregunta[]>('http://localhost:3000/preguntas')
      .subscribe(data => {
        this.preguntas = data;
        this.preguntas.forEach(pregunta => {
          pregunta.idString = pregunta.id.toString(); // Inicializar idString como cadena
        });
      });
  }


  guardarRespuesta(pregunta: Pregunta, opcion: string) {
    if (pregunta.opciones) {
      // Pregunta con opciones predefinidas
      pregunta.respuesta = opcion;
    } else {
      // Pregunta con respuesta libre (campo de texto)
      pregunta.respuestaLibre = opcion;
    }
    this.preguntaSeleccionada = pregunta;

    // Convertir el valor del campo "id" a cadena antes de guardarlo
    pregunta.idString = pregunta.id.toString();
  }



  nombrePersona = ''; // Variable para almacenar el nombre de la persona que responde

  enviarRespuestas() {
    // Filtrar las preguntas que tienen respuesta
    const preguntasConRespuestas = this.preguntas.filter(pregunta => pregunta.respuesta);

    if (preguntasConRespuestas.length > 0 && this.nombrePersona) {
      // Asignar el nombre de la persona que responde a cada pregunta con respuesta
      preguntasConRespuestas.forEach(pregunta => {
        pregunta.nombre = this.nombrePersona;
      });

      // Crear un objeto para almacenar las respuestas agrupadas por nombre de la persona
      const respuestasAgrupadas: { [key: string]: Pregunta[] } = {};

      // Agrupar las preguntas con respuesta en el objeto respuestasAgrupadas
      preguntasConRespuestas.forEach(pregunta => {
        const key = pregunta.nombre; // Usar el nombre de la persona como clave
        if (!respuestasAgrupadas[key]) {
          respuestasAgrupadas[key] = [];
        }
        respuestasAgrupadas[key].push(pregunta);
      });

      // Enviar las respuestas agrupadas al servidor
      this.http.post('http://localhost:3000/respuestas', respuestasAgrupadas)
        .subscribe(
          data => {
            console.log('Respuestas guardadas:', data);
            this.snackBar.open('Respuestas guardadas con éxito', 'Cerrar', { duration: 3000 });
            this.limpiarRespuestas();
          },
          error => {
            console.error('Error al guardar las respuestas:', error);
            this.snackBar.open('Hubo un error al guardar las respuestas', 'Cerrar', { duration: 3000 });
          }
        );
    } else {
      this.snackBar.open('Debes seleccionar al menos una respuesta y proporcionar tu nombre antes de enviar.', 'Cerrar', { duration: 3000 });
    }
  }



  limpiarRespuestas() {
    this.preguntas.forEach(pregunta => {
      pregunta.respuesta = pregunta.respuesta ?? undefined;
      pregunta.respuestaLibre = '';
    });
    this.preguntaSeleccionada = null;
  }
}
