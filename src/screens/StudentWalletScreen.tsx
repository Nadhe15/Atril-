// src/screens/StudentWalletScreen.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SesionClaseRow } from '../types/atril.types';

export interface StudentWalletScreenProps {
  nombreUsuario: string;
  sesionActiva: SesionClaseRow | null;
  estadoEscrow: string;
}

export default function StudentWalletScreen({
  nombreUsuario,
  sesionActiva,
  estadoEscrow,
}: StudentWalletScreenProps) {
  const [saldoDisponiblePrueba, setSaldoDisponiblePrueba] = useState<number>(180.0);

  const montoEnCustodia =
    sesionActiva && sesionActiva.estado_escrow === 'bloqueado'
      ? sesionActiva.monto_bruto
      : 0;

  const montoLiberado =
    sesionActiva && sesionActiva.estado_escrow === 'liberado'
      ? sesionActiva.monto_bruto
      : 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerBlock}>
        <Text style={styles.microTag}>BILLETERA FIDUCIARIA</Text>
        <Text style={styles.title}>Mi Saldo y Custodia Escrow</Text>
        <Text style={styles.subtitle}>
          Titular financiero: {nombreUsuario} • Fondos respaldados por FundaOboeHJK.
        </Text>
      </View>

      {/* Tarjeta Principal Azul Marino de Saldos */}
      <View style={styles.walletNavyCard}>
        <View style={styles.balanceRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.balanceLabel}>SALDO DISPONIBLE (PRUEBA)</Text>
            <Text style={styles.balanceMain}>${saldoDisponiblePrueba.toFixed(2)} USD</Text>
          </View>

          <TouchableOpacity
            style={styles.topUpBtn}
            activeOpacity={0.85}
            onPress={() => setSaldoDisponiblePrueba((prev) => Number((prev + 50).toFixed(2)))}
          >
            <Text style={styles.topUpBtnText}>＋ Recargar $50</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.navyDivider} />

        <View style={styles.escrowSplitRow}>
          <View style={styles.escrowSplitItem}>
            <Text style={styles.escrowSubLabel}>CONGELADO EN ESCROW</Text>
            <Text style={styles.escrowFrozenValue}>${montoEnCustodia.toFixed(2)} USD</Text>
          </View>
          <View style={styles.escrowSplitItem}>
            <Text style={styles.escrowSubLabel}>LIBERADO A DOCENTES</Text>
            <Text style={styles.escrowReleasedValue}>${montoLiberado.toFixed(2)} USD</Text>
          </View>
        </View>
      </View>

      {/* Explicación del Modelo Fiduciario */}
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>¿Cómo protege ATRIL tu dinero?</Text>
        <Text style={styles.bulletText}>
          • <Text style={styles.bold}>Bloqueo Preventivo:</Text> Al reservar una clase o abono, el monto queda congelado en custodia fiduciaria.
        </Text>
        <Text style={styles.bulletText}>
          • <Text style={styles.bold}>Validación por Código:</Text> El profesor solo recibe el 85% neto tras dictar la sesión y validarse tu asistencia.
        </Text>
        <Text style={styles.bulletText}>
          • <Text style={styles.bold}>Garantía de Contingencia:</Text> Si falla la electricidad o el internet, reprogramas sin perder tu saldo.
        </Text>
      </View>

      {/* Historial de Movimientos */}
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Movimientos Recientes</Text>

        {sesionActiva ? (
          <View style={styles.txItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.txTitle}>
                Reserva #{sesionActiva.id.slice(0, 8).toUpperCase()}
              </Text>
              <Text style={styles.txSub}>{estadoEscrow}</Text>
            </View>
            <Text style={styles.txAmount}>-${sesionActiva.monto_bruto.toFixed(2)} USD</Text>
          </View>
        ) : null}

        <View style={styles.txItem}>
          <View style={{ flex: 1 }}>
            <Text style={styles.txTitle}>Abono Inicial de Prueba ATRIL</Text>
            <Text style={styles.txSub}>Saldo acreditado para reservas demostrativas</Text>
          </View>
          <Text style={[styles.txAmount, { color: VERDE }]}>
            +${saldoDisponiblePrueba.toFixed(2)} USD
          </Text>
        </View>
      </View>
    </View>
  );
}

const AZUL_REY = '#1D4ED8';
const AZUL_MARINO = '#0A192F';
const FONDO = '#F8FAFC';
const BLANCO = '#FFFFFF';
const AMBAR = '#D97706';
const VERDE = '#059669';

const styles = StyleSheet.create({
  container: {
    backgroundColor: FONDO,
  },
  headerBlock: {
    marginBottom: 14,
  },
  microTag: {
    fontSize: 10,
    fontWeight: '800',
    color: AZUL_REY,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: AZUL_MARINO,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },
  walletNavyCard: {
    backgroundColor: AZUL_MARINO,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#93C5FD',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  balanceMain: {
    color: BLANCO,
    fontSize: 26,
    fontWeight: '900',
  },
  topUpBtn: {
    backgroundColor: AZUL_REY,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  topUpBtnText: {
    color: BLANCO,
    fontSize: 11.5,
    fontWeight: '800',
  },
  navyDivider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: 14,
  },
  escrowSplitRow: {
    flexDirection: 'row',
    gap: 12,
  },
  escrowSplitItem: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 10,
  },
  escrowSubLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 4,
  },
  escrowFrozenValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FDE68A',
  },
  escrowReleasedValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#34D399',
  },
  infoCard: {
    backgroundColor: BLANCO,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: AZUL_MARINO,
    marginBottom: 10,
  },
  bulletText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 6,
  },
  bold: {
    fontWeight: '800',
    color: AZUL_MARINO,
  },
  txItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  txTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: AZUL_MARINO,
  },
  txSub: {
    fontSize: 11.5,
    color: '#64748B',
  },
  txAmount: {
    fontSize: 13.5,
    fontWeight: '900',
    color: AMBAR,
  },
});
