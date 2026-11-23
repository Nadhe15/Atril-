// tests/supabase-test-db.ts
/**
 * Base de datos relacional de pruebas para ATRIL v5.0 (tablas: usuarios, perfiles_profesores,
 * conversaciones, mensajes + Supabase Auth + canales Realtime).
 * Permite creación y limpieza automática en cada prueba (beforeEach / afterEach) sin exponer
 * datos reales ni credenciales externas.
 */

export interface AuthUserRecord {
  id: string;
  email: string;
  password: string;
  user_metadata: Record<string, unknown>;
}

class SupabaseTestDatabase {
  public authUsers = new Map<string, AuthUserRecord>();
  public currentSessionUser: AuthUserRecord | null = null;
  public tables: Record<string, Record<string, unknown>[]> = {
    usuarios: [],
    perfiles_profesores: [],
    conversaciones: [],
    mensajes: [],
  };
  public realtimeListeners = new Map<string, Set<(payload: { new: Record<string, unknown> }) => void>>();
  public forceAuthError: string | null = null;

  public reset(): void {
    this.authUsers.clear();
    this.currentSessionUser = null;
    this.forceAuthError = null;
    this.realtimeListeners.clear();
    this.tables = {
      usuarios: [],
      perfiles_profesores: [
        {
          id: 'prof-verificado-01',
          user_id: '99999999-9999-9999-9999-999999999999',
          bio: 'Solista principal y formador titular FundaOboeHJK.',
          instrumentos: ['Oboe Sinfónico', 'Lenguaje Musical'],
          modalidades: ['presencial_caracas', 'online_en_vivo', 'hibrido'],
          verificado_fundaoboe: true,
          usuarios: {
            id: '99999999-9999-9999-9999-999999999999',
            nombre_completo: 'Mtro. José Gregorio Sanabria',
            email: 'privado.docente@fundaoboe.org',
            telefono: '+58 412-9999999',
            cedula_identidad: 'V-10458921',
          },
        },
        {
          id: 'prof-no-verificado-02',
          user_id: '11111111-2222-3333-4444-555555555555',
          bio: 'Docente en proceso de revisión.',
          instrumentos: ['Guitarra Clásica'],
          modalidades: ['online_en_vivo'],
          verificado_fundaoboe: false,
          usuarios: {
            id: '11111111-2222-3333-4444-555555555555',
            nombre_completo: 'Prof. No Verificado',
          },
        },
      ],
      conversaciones: [],
      mensajes: [],
    };
  }
}

export const testDb = new SupabaseTestDatabase();
testDb.reset();

class QueryBuilder {
  private table: string;
  private op: 'select' | 'insert' | 'upsert' | 'update' = 'select';
  private payload: unknown = null;
  private filters: ((row: Record<string, unknown>) => boolean)[] = [];
  private orderField: string | null = null;
  private orderAsc = true;
  private selectedColumns = '*';

  constructor(table: string) {
    this.table = table;
  }

  select(cols = '*') {
    this.selectedColumns = cols;
    return this;
  }

  insert(rows: Record<string, unknown>[]) {
    this.op = 'insert';
    this.payload = rows;
    return this;
  }

  upsert(rows: Record<string, unknown>[], _opts?: { onConflict?: string }) {
    this.op = 'upsert';
    this.payload = rows;
    return this;
  }

  update(values: Record<string, unknown>) {
    this.op = 'update';
    this.payload = values;
    return this;
  }

  eq(col: string, val: unknown) {
    this.filters.push((r) => r[col] === val);
    return this;
  }

  or(expr: string) {
    const parts = expr.split(',').map((p) => p.trim());
    this.filters.push((r) =>
      parts.some((part) => {
        const [col, , val] = part.split('.');
        return String(r[col]) === val;
      })
    );
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orderField = col;
    this.orderAsc = opts?.ascending ?? true;
    return this;
  }

  private projectRow(row: Record<string, unknown>): Record<string, unknown> {
    if (this.table === 'perfiles_profesores' && this.selectedColumns.includes('usuarios')) {
      const u = row.usuarios as Record<string, unknown> | undefined;
      return {
        id: row.id,
        user_id: row.user_id,
        bio: row.bio,
        instrumentos: row.instrumentos,
        modalidades: row.modalidades,
        verificado_fundaoboe: row.verificado_fundaoboe,
        usuarios: u ? { id: u.id, nombre_completo: u.nombre_completo } : null,
      };
    }
    return { ...row };
  }

  private execute(): { data: Record<string, unknown>[]; error: { message: string } | null } {
    const list = testDb.tables[this.table] ?? [];

    if (this.op === 'insert') {
      const rows: Record<string, unknown>[] = (
        this.payload as Record<string, unknown>[]
      ).map((r): Record<string, unknown> => {
        const now = new Date().toISOString();
        return {
          id:
            (r.id as string) ||
            `${this.table}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
          created_at: (r.created_at as string) || now,
          updated_at: (r.updated_at as string) || now,
          ...r,
        };
      });

      if (this.table === 'conversaciones') {
        for (const r of rows) {
          const dup = list.find(
            (c) => c.alumno_id === r.alumno_id && c.profesor_id === r.profesor_id
          );
          if (dup) {
            return {
              data: [],
              error: { message: 'duplicate key value violates unique constraint UNIQUE(alumno_id, profesor_id)' },
            };
          }
        }
      }

      list.push(...rows);

      if (this.table === 'mensajes') {
        for (const msg of rows) {
          const convId = String(msg.conversacion_id);
          const conv = testDb.tables.conversaciones.find((c) => c.id === convId);
          if (conv) {
            conv.ultimo_mensaje = msg.contenido;
            conv.updated_at = msg.created_at;
          }
        }
      }

      return { data: rows, error: null };
    }

    if (this.op === 'upsert') {
      const rows = this.payload as Record<string, unknown>[];
      const result: Record<string, unknown>[] = [];
      for (const r of rows) {
        const idx = list.findIndex((item) => item.id === r.id);
        const now = new Date().toISOString();
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...r };
          result.push(list[idx]);
        } else {
          const created = { created_at: now, ...r };
          list.push(created);
          result.push(created);
        }
      }
      return { data: result, error: null };
    }

    if (this.op === 'update') {
      const patch = this.payload as Record<string, unknown>;
      const matched: Record<string, unknown>[] = [];
      for (let i = 0; i < list.length; i++) {
        if (this.filters.every((fn) => fn(list[i]))) {
          list[i] = { ...list[i], ...patch };
          matched.push(list[i]);
        }
      }
      if (matched.length === 0) {
        return { data: [], error: { message: 'Row not found' } };
      }
      return { data: matched, error: null };
    }

    // SELECT
    let filtered = list.filter((r) => this.filters.every((fn) => fn(r))).map((r) => this.projectRow(r));
    if (this.orderField) {
      const col = this.orderField;
      const asc = this.orderAsc;
      filtered.sort((a, b) => {
        const va = String(a[col] ?? '');
        const vb = String(b[col] ?? '');
        return asc ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }
    return { data: filtered, error: null };
  }

  async single() {
    const res = this.execute();
    if (res.error) return { data: null, error: res.error };
    if (res.data.length === 0) return { data: null, error: { message: 'No rows found' } };
    return { data: res.data[0], error: null };
  }

  async maybeSingle() {
    const res = this.execute();
    if (res.error) return { data: null, error: res.error };
    return { data: res.data[0] ?? null, error: null };
  }

  then<TResult1 = { data: Record<string, unknown>[]; error: { message: string } | null }>(
    onfulfilled?: ((value: { data: Record<string, unknown>[]; error: { message: string } | null }) => TResult1 | PromiseLike<TResult1>) | null
  ) {
    const res = this.execute();
    return Promise.resolve(res).then(onfulfilled);
  }
}

export const supabase = {
  auth: {
    async signUp({
      email,
      password,
      options,
    }: {
      email: string;
      password: string;
      options?: { data?: Record<string, unknown> };
    }) {
      if (testDb.forceAuthError) {
        return { data: { user: null }, error: { message: testDb.forceAuthError } };
      }
      if (testDb.authUsers.has(email)) {
        return { data: { user: null }, error: { message: 'User already registered' } };
      }
      const user: AuthUserRecord = {
        id: `usr-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        email,
        password,
        user_metadata: options?.data ?? {},
      };
      testDb.authUsers.set(email, user);
      testDb.currentSessionUser = user;
      return { data: { user }, error: null };
    },

    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const user = testDb.authUsers.get(email);
      if (!user || user.password !== password) {
        return {
          data: { user: null, session: null },
          error: { message: 'Invalid login credentials' },
        };
      }
      testDb.currentSessionUser = user;
      return { data: { user, session: { user } }, error: null };
    },

    async getSession() {
      if (!testDb.currentSessionUser) {
        return { data: { session: null }, error: null };
      }
      return { data: { session: { user: testDb.currentSessionUser } }, error: null };
    },

    async signOut() {
      testDb.currentSessionUser = null;
      return { error: null };
    },
  },

  from(table: string) {
    return new QueryBuilder(table);
  },

  channel(name: string) {
    const chan = {
      name,
      on(
        _type: string,
        filterObj: { filter?: string },
        callback: (payload: { new: Record<string, unknown> }) => void
      ) {
        const filterKey = filterObj?.filter || name;
        const set = testDb.realtimeListeners.get(filterKey) ?? new Set();
        set.add(callback);
        testDb.realtimeListeners.set(filterKey, set);
        return chan;
      },
      subscribe() {
        return chan;
      },
    };
    return chan;
  },

  removeChannel(_chan: unknown) {
    return Promise.resolve();
  },
};
