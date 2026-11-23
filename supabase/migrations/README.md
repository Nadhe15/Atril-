# Migraciones de Base de Datos Versionadas — ATRIL v5.0

> **Política DoD (Criterios #12 y #13):** Todo cambio de esquema o de políticas RLS en Supabase/PostgreSQL debe quedar versionado en este directorio con su script de aplicación (`.sql`) y su script de reversión (`.down.sql`). **Están prohibidos los cambios manuales directos en la base de datos de staging o producción sin archivo versionado.**

## Inventario de Migraciones

| Versión | Archivo UP (Aplicar) | Archivo DOWN (Revertir) | Propósito |
|---|---|---|---|
| `20261118` | `20261118_v5_mvp_verification_chat.sql` | `20261118_v5_mvp_verification_chat.down.sql` | Extiende `public.usuarios` (estado de verificación, LOPNNA representante), crea `conversaciones`, `mensajes`, trigger de timestamp y políticas RLS. |
| `20261122` | `20261122_v5_stride_rls_hardening.sql` | `20261122_v5_stride_rls_hardening.down.sql` | Mitigación STRIDE (Information Disclosure): restringe lectura en `public.usuarios` al propio titular, rol `admin` o docentes verificados. |
| `20261123` | `20261123_v5_fix_rls_and_profesores.sql` | `20261123_v5_fix_rls_and_profesores.down.sql` | Corrige recursión RLS (`42P17`) con `es_admin_atril()` (`SECURITY DEFINER`), crea `public.perfiles_profesores`, sincroniza `auth.users` → `public.usuarios` y activa Realtime en `mensajes`. |

## Ejecución Reproducible y Rollback

```bash
# Aplicar migraciones en orden (Supabase CLI, SQL Editor o psql contra staging)
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20261118_v5_mvp_verification_chat.sql
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20261122_v5_stride_rls_hardening.sql
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20261123_v5_fix_rls_and_profesores.sql

# Revertir última migración (Rollback controlado)
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20261123_v5_fix_rls_and_profesores.down.sql
```
