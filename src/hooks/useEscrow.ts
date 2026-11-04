// src/hooks/useEscrow.ts
import { useState, useCallback } from 'react';
import {
  BloquearFondosParams,
  ResumenBilleteraProfesor,
  ResumenBilleteraTutor,
  SesionClaseRow,
} from '../types/atril.types';
import {
  bloquearFondosEscrow,
  configurarEnlaceZoomDocente,
  obtenerEnlaceZoomSeguro,
  obtenerResumenBilletera,
} from '../services/escrowService';

export function useEscrow() {
  const [loadingEscrow, setLoadingEscrow] = useState(false);
  const [errorEscrow, setErrorEscrow] = useState<string | null>(null);
  const [sesionActiva, setSesionActiva] = useState<SesionClaseRow | null>(null);
  const [billeteraTutor, setBilleteraTutor] = useState<ResumenBilleteraTutor | null>(null);
  const [billeteraProfesor, setBilleteraProfesor] = useState<ResumenBilleteraProfesor | null>(null);

  const reservarConCustodia = useCallback(async (params: BloquearFondosParams) => {
    setLoadingEscrow(true);
    setErrorEscrow(null);
    try {
      const resultado = await bloquearFondosEscrow(params);
      setSesionActiva(resultado.sesion);
      return resultado;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al reservar con custodia Escrow';
      setErrorEscrow(msg);
      throw err;
    } finally {
      setLoadingEscrow(false);
    }
  }, []);

  const cargarBilleteraTutor = useCallback(async (tutorId: string) => {
    setLoadingEscrow(true);
    setErrorEscrow(null);
    try {
      const resumen = await obtenerResumenBilletera(tutorId, 'tutor');
      if (resumen.rol === 'tutor') {
        setBilleteraTutor(resumen);
        return resumen;
      }
      return null;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al consultar billetera del tutor';
      setErrorEscrow(msg);
      throw err;
    } finally {
      setLoadingEscrow(false);
    }
  }, []);

  const cargarBilleteraProfesor = useCallback(async (profesorId: string) => {
    setLoadingEscrow(true);
    setErrorEscrow(null);
    try {
      const resumen = await obtenerResumenBilletera(profesorId, 'profesor');
      if (resumen.rol === 'profesor') {
        setBilleteraProfesor(resumen);
        return resumen;
      }
      return null;
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Error al consultar billetera del profesor';
      setErrorEscrow(msg);
      throw err;
    } finally {
      setLoadingEscrow(false);
    }
  }, []);

  const actualizarZoomDocente = useCallback(
    async (sesionId: string, profesorId: string, enlaceZoom: string) => {
      setLoadingEscrow(true);
      setErrorEscrow(null);
      try {
        const actualizada = await configurarEnlaceZoomDocente(sesionId, profesorId, enlaceZoom);
        setSesionActiva(actualizada);
        return actualizada;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al configurar enlace de Zoom';
        setErrorEscrow(msg);
        throw err;
      } finally {
        setLoadingEscrow(false);
      }
    },
    []
  );

  return {
    loadingEscrow,
    errorEscrow,
    sesionActiva,
    billeteraTutor,
    billeteraProfesor,
    reservarConCustodia,
    cargarBilleteraTutor,
    cargarBilleteraProfesor,
    actualizarZoomDocente,
    obtenerEnlaceZoomSeguro,
  };
}
