import { isDevMode } from '@angular/core';


const URL_PRODUCCION = 'https://petgram-roan-alpha.vercel.app';

export const API_URL = isDevMode() ? 'http://localhost:3000' : URL_PRODUCCION;
