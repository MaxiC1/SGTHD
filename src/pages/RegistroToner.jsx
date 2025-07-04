import { useState, useEffect } from 'react';
import { clientes } from '../data/clientes';
import { toners } from '../data/toners';
import { historialMaquinas } from '../data/historial';
import RegistroForm from '../components/RegistroForm';

export default function RegistroToner() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Registro de Cambio de Tóner</h1>
      <RegistroForm />
    </div>
  );
}