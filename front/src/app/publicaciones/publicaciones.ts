import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPaw, faComment } from '@fortawesome/free-solid-svg-icons';

interface Publicacion {
  id: number;
  usuario: string;
  avatar: string;
  fecha: string;
  imagen: string;
  descripcion: string;
  likes: number;
  liked: boolean;
  mostrarPaw: boolean; // controla la huella grande que aparece con doble click
}

@Component({
  imports: [FontAwesomeModule],
  selector: 'app-publicaciones',
  styleUrl: './publicaciones.css',
  templateUrl: './publicaciones.html',
})
export class Publicaciones {
  faPaw = faPaw;
  faComment = faComment;

  // Datos de ejemplo. Luego se reemplazan por los que lleguen del Back (NestJS)
  publicaciones: Publicacion[] = [
    {
      id: 1,
      usuario: 'luna_la_perra',
      avatar: 'https://picsum.photos/seed/avatar1/100',
      fecha: 'Hace 2 horas',
      imagen: 'https://picsum.photos/seed/perro1/600/600',
      descripcion: 'Paseo de la tarde por la plaza 🐶',
      likes: 24,
      liked: false,
      mostrarPaw: false,
    },
    {
      id: 2,
      usuario: 'michi_rey',
      avatar: 'https://picsum.photos/seed/avatar2/100',
      fecha: 'Hace 5 horas',
      imagen: 'https://picsum.photos/seed/gato1/600/600',
      descripcion: 'Dormilón como siempre 😴',
      likes: 58,
      liked: true,
      mostrarPaw: false,
    },
    {
      id: 3,
      usuario: 'thor_y_odin',
      avatar: 'https://picsum.photos/seed/avatar3/100',
      fecha: 'Ayer',
      imagen: 'https://picsum.photos/seed/perro2/600/600',
      descripcion: 'Los hermanos más traviesos del barrio',
      likes: 112,
      liked: false,
      mostrarPaw: false,
    },
  ];

  // Click en la huellita: da o quita el like
  toggleLike(pub: Publicacion) {
    pub.liked = !pub.liked;
    pub.likes += pub.liked ? 1 : -1;
  }

  // Doble click sobre la imagen (como en Instagram): solo da like, no lo quita
  likeConDobleClick(pub: Publicacion) {
    if (!pub.liked) {
      pub.liked = true;
      pub.likes++;
    }
    pub.mostrarPaw = true;
    setTimeout(() => (pub.mostrarPaw = false), 800);
  }
}