// src/components/SupabaseStatusBadge.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { supabase } from '../lib/supabase';

type ConnectionState = 'IDLE' | 'CHECKING' | 'CONNECTED' | 'ERROR';

export default function SupabaseStatusBadge() {
  const [status, setStatus] = useState<ConnectionState>('IDLE');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const mostrarAlerta = (titulo: string, detalle: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${titulo}\n\n${detalle}`);
    } else {
      Alert.alert(titulo, detalle);
    }
  };

  const comprobarConexion = async () => {
    try {
      setStatus('CHECKING');
      const inicio = Date.now();

      const { error, status: httpStatus } = await supabase
        .from('usuarios')
        .select('id', { count: 'exact', head: true });

      if (error) {
        throw error;
      }

      const duracion = Date.now() - inicio;
      setLatencyMs(duracion);
      setStatus('CONNECTED');

      // Si el servidor responde 200/204 (HEAD query exitosa en PostgREST)
      if (httpStatus && httpStatus >= 400) {
        throw new Error(`Código HTTP inesperado: ${httpStatus}`);
      }
    } catch (err: any) {
      setStatus('ERROR');
      mostrarAlerta(
        'Error de Conexión con Supabase',
        err?.message ||
          'No se pudo establecer comunicación con el motor PostgreSQL. Verifica las variables en tu archivo .env.'
      );
    }
  };

  const isConnected = status === 'CONNECTED';
  const isError = status === 'ERROR';
  const isChecking = status === 'CHECKING';

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[
          styles.chip,
          isConnected && styles.chipConnected,
          isError && styles.chipError,
        ]}
        onPress={comprobarConexion}
        disabled={isChecking}
        activeOpacity={0.8}
      >
        {isChecking ? (
          <View style={styles.row}>
            <ActivityIndicator size="small" color="#1D4ED8" style={styles.spinner} />
            <Text style={styles.textChecking}>Verificando...</Text>
          </View>
        ) : isConnected ? (
          <View style={styles.row}>
            <View style={styles.dotConnected} />
            <Text style={styles.textConnected}>
              ✓ PostgreSQL 16 Conectado (HTTP 200 OK)
              {latencyMs !== null ? ` • ${latencyMs}ms` : ''}
            </Text>
          </View>
        ) : (
          <View style={styles.row}>
            <View style={[styles.dotIdle, isError && styles.dotError]} />
            <Text style={[styles.textIdle, isError && styles.textError]}>
              {isError
                ? 'Reintentar conexión con Backend PostgreSQL'
                : 'Comprobar conexión con Backend PostgreSQL'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const AZUL_REY = '#1D4ED8';
const VERDE_INSTITUCIONAL = '#059669';

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 18,
    alignItems: 'center',
    width: '100%',
  },
  chip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  chipConnected: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  chipError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginRight: 8,
  },
  dotIdle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AZUL_REY,
    marginRight: 8,
  },
  dotConnected: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: VERDE_INSTITUCIONAL,
    marginRight: 8,
  },
  dotError: {
    backgroundColor: '#DC2626',
  },
  textIdle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: AZUL_REY,
  },
  textChecking: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E40AF',
  },
  textConnected: {
    fontSize: 11.5,
    fontWeight: '800',
    color: VERDE_INSTITUCIONAL,
  },
  textError: {
    color: '#DC2626',
  },
});
