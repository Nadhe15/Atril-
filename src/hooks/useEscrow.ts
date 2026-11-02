// src/hooks/useEscrow.ts
import { useState } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import {
  CATALOGO_PAQUETES_ATRIL,
  ModalidadClase,
  PaqueteAbono,
} from '../types/database';

export function useEscrow() {
  const [loadingEscrow, setLoadingEscrow] = useState(false);
  const [saldoDisponibleAlumno, setSaldoDisponibleAlumno] = useState<number>(60.0);
  const [saldoEnCustodiaAlumno, setSaldoEnCustodiaAlumno] = useState<number>(45.0);
  const [honorariosAcumuladosDocente, setHonorariosAcumuladosDocente] = useState<number>(212.5);
  const [porLiberarDocente, setPorLiberarDocente] = useState<number>(42.5);

  const registrarEventoAuditoria = async (accion: string, detalle: string) => {
    const { data, error } = await supabase
      .from('health_check_fase0')
      .insert([
        {
          dispositivo: `${Platform.OS} (${Platform.Version})`,
          mensaje: `[ESCROW-MUTATION] ${accion} | ${detalle}`,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const contratarAbono = async (
    paqueteId: PaqueteAbono['id'],
    alumnoNombre: string,
    modalidad: ModalidadClase = 'ONLINE'
  ) => {
    setLoadingEscrow(true);
    try {
      const paquete = CATALOGO_PAQUETES_ATRIL[paqueteId];
      const registro = await registrarEventoAuditoria(
        'CONTRATAR_ABONO',
        `Paquete: ${paquete.nombre} | Bruto: $${paquete.monto_bruto_usd} USD | Neto Docente: $${paquete.honorario_neto_docente_usd} USD | Alumno: ${alumnoNombre} | Modalidad: ${modalidad}`
      );

      return {
        ok: true,
        transaccionId: registro.id,
        paquete,
      };
    } finally {
      setLoadingEscrow(false);
    }
  };

  const confirmarYBloquearEscrow = async (montoUsd: number, alumnoNombre: string) => {
    setLoadingEscrow(true);
    try {
      const registro = await registrarEventoAuditoria(
        'BLOQUEAR_FONDO_ESCROW',
        `Monto bloqueado en custodia: $${montoUsd.toFixed(2)} USD | Beneficiario: ${alumnoNombre} | Estado: RETENIDO_ESCROW`
      );

      setSaldoDisponibleAlumno((prev) => Math.max(0, Number((prev - montoUsd).toFixed(2))));
      setSaldoEnCustodiaAlumno((prev) => Number((prev + montoUsd).toFixed(2)));
      setPorLiberarDocente((prev) => Number((prev + montoUsd * 0.85).toFixed(2)));

      return {
        ok: true,
        transaccionId: registro.id,
        montoBloqueado: montoUsd,
      };
    } finally {
      setLoadingEscrow(false);
    }
  };

  const declararClaseImpartida = async (alumnoNombre: string, tarifaBrutaUsd: number = 25.0) => {
    setLoadingEscrow(true);
    try {
      const comisionAtril = Number((tarifaBrutaUsd * 0.15).toFixed(2));
      const honorarioNeto = Number((tarifaBrutaUsd - comisionAtril).toFixed(2));

      const registro = await registrarEventoAuditoria(
        'DECLARAR_CLASE_IMPARTIDA',
        `Alumno: ${alumnoNombre} | Bruto: $${tarifaBrutaUsd} | Comisión 15%: -$${comisionAtril} | Neto Liberado: +$${honorarioNeto} USD`
      );

      setPorLiberarDocente((prev) => Math.max(0, Number((prev - honorarioNeto).toFixed(2))));
      setHonorariosAcumuladosDocente((prev) => Number((prev + honorarioNeto).toFixed(2)));
      setSaldoEnCustodiaAlumno((prev) => Math.max(0, Number((prev - tarifaBrutaUsd).toFixed(2))));

      return {
        ok: true,
        transaccionId: registro.id,
        comisionAtril,
        honorarioNeto,
      };
    } finally {
      setLoadingEscrow(false);
    }
  };

  return {
    loadingEscrow,
    saldoDisponibleAlumno,
    saldoEnCustodiaAlumno,
    honorariosAcumuladosDocente,
    porLiberarDocente,
    contratarAbono,
    confirmarYBloquearEscrow,
    declararClaseImpartida,
  };
}
