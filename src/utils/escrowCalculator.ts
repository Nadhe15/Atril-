// src/utils/escrowCalculator.ts
import { DesgloseAbono, DesgloseHonorario } from '../types/atril.types';

const COMISION_PLATAFORMA_RATIO = 0.15;
const HONORARIO_DOCENTE_RATIO = 0.85;

/**
 * Redondeo financiero seguro a 2 decimales para evitar errores de punto flotante (IEEE 754).
 */
export function redondearMoneda(valor: number): number {
  if (!Number.isFinite(valor)) {
    throw new Error('El valor monetario debe ser un número finito.');
  }
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

/**
 * Calcula la distribución fiduciaria de una sesión individual:
 * - 15% Comisión de plataforma (FundaOboeHJK)
 * - 85% Honorario líquido neto para el docente
 */
export function calcularHonorarioClase(tarifaBruta: number): DesgloseHonorario {
  if (!Number.isFinite(tarifaBruta) || tarifaBruta <= 0) {
    throw new Error('La tarifa bruta de la clase debe ser mayor a $0.00 USD.');
  }

  const bruto = redondearMoneda(tarifaBruta);
  const comisionPlataforma = redondearMoneda(bruto * COMISION_PLATAFORMA_RATIO);
  // Garantiza que comisionPlataforma + honorarioNeto === bruto exacto al centavo
  const honorarioNeto = redondearMoneda(bruto - comisionPlataforma);

  return {
    bruto,
    comisionPlataforma,
    honorarioNeto,
  };
}

/**
 * Calcula el precio de contado y desglose fiduciario de un Abono Prepagado:
 * - 6 clases: 10% de ahorro directo -> (tarifaBase * 6) * 0.90
 * - 8 clases: 12% de ahorro directo -> (tarifaBase * 8) * 0.88
 */
export function calcularAbono(tipo: 6 | 8, tarifaBase: number): DesgloseAbono {
  if (tipo !== 6 && tipo !== 8) {
    throw new Error('El tipo de abono solo permite paquetes de 6 u 8 clases.');
  }
  if (!Number.isFinite(tarifaBase) || tarifaBase <= 0) {
    throw new Error('La tarifa base por sesión debe ser mayor a $0.00 USD.');
  }

  const factorDescuento = tipo === 6 ? 0.90 : 0.88;
  const porcentajeAhorro: 10 | 12 = tipo === 6 ? 10 : 12;

  const subtotalSinDescuento = redondearMoneda(tarifaBase * tipo);
  const totalAPagarContado = redondearMoneda(subtotalSinDescuento * factorDescuento);
  const ahorroUsd = redondearMoneda(subtotalSinDescuento - totalAPagarContado);
  const equivalentePorClase = redondearMoneda(totalAPagarContado / tipo);

  const comisionPlataformaTotal = redondearMoneda(
    totalAPagarContado * COMISION_PLATAFORMA_RATIO
  );
  const honorarioNetoDocenteTotal = redondearMoneda(
    totalAPagarContado * HONORARIO_DOCENTE_RATIO
  );

  return {
    tipoClases: tipo,
    tarifaBaseUnitaria: redondearMoneda(tarifaBase),
    subtotalSinDescuento,
    porcentajeAhorro,
    ahorroUsd,
    totalAPagarContado,
    equivalentePorClase,
    comisionPlataformaTotal,
    honorarioNetoDocenteTotal,
  };
}
