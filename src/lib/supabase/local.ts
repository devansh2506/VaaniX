/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Local data store used when no Supabase project is configured.
 *
 * Implements the subset of the Supabase query API this app uses (from/select/insert/update/
 * upsert/delete with eq/gte/order/range/limit/single/maybeSingle), backed by a JSON file on
 * disk (LOCAL_DB_PATH, default .data/local-db.json). There is no sign-in: every request runs
 * as a single local user. Server-only.
 */
import fs from 'node:fs';
import path from 'node:path';

type Row = Record<string, any>;
type Store = Record<string, Row[]>;

export const LOCAL_USER_ID = '00000000-0000-4000-8000-000000000001';
const LOCAL_BANK_ID = '00000000-0000-4000-8000-0000000000b1';

const LOCAL_USER = {
  id: LOCAL_USER_ID,
  email: 'you@vaanix.app',
  user_metadata: { full_name: 'VaaniX User' },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date(0).toISOString(),
};

export function isLocalMode(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !url || url.includes('placeholder');
}

const DB_PATH = path.resolve(process.env.LOCAL_DB_PATH || '.data/local-db.json');
const EVIDENCE_DIR = path.join(path.dirname(DB_PATH), 'evidence');

const nowIso = () => new Date().toISOString();
const uuid = () => globalThis.crypto.randomUUID();
const hex = () => uuid().replace(/-/g, '');

const STATES =
  'AP:Andhra Pradesh|AR:Arunachal Pradesh|AS:Assam|BR:Bihar|CG:Chhattisgarh|GA:Goa|GJ:Gujarat|HR:Haryana|' +
  'HP:Himachal Pradesh|JH:Jharkhand|KA:Karnataka|KL:Kerala|MP:Madhya Pradesh|MH:Maharashtra|MN:Manipur|' +
  'ML:Meghalaya|MZ:Mizoram|NL:Nagaland|OD:Odisha|PB:Punjab|RJ:Rajasthan|SK:Sikkim|TN:Tamil Nadu|TS:Telangana|' +
  'TR:Tripura|UP:Uttar Pradesh|UK:Uttarakhand|WB:West Bengal|AN:Andaman and Nicobar Islands|CH:Chandigarh|' +
  'DN:Dadra and Nagar Haveli and Daman and Diu|DL:Delhi|JK:Jammu and Kashmir|LA:Ladakh|LD:Lakshadweep|PY:Puducherry';

/** Reference data from supabase/migrations/0003_seed_banks_and_states.sql plus the local user's profile. */
function initialStore(): Store {
  return {
    banks: [{ id: LOCAL_BANK_ID, name: 'Sample Bank (Demo)', fraud_email: 'fraud@samplebank.example', is_demo: true, created_at: nowIso() }],
    cyber_cells: STATES.split('|').map((s) => {
      const [state_code, state_name] = s.split(':');
      return { state_code, state_name, email: null, portal_url: 'https://cybercrime.gov.in', source_url: null, verified: false, verified_on: null };
    }),
    profiles: [
      {
        id: LOCAL_USER_ID, display_name: 'VaaniX User', phone_e164: null, state_code: null, bank_id: null,
        telegram_chat_id: null, telegram_link_token: hex(), created_at: nowIso(),
      },
    ],
  };
}

function store(): Store {
  const g = globalThis as any;
  if (!g.__vaanixLocalStore) {
    let data: Store | null = null;
    try {
      data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch {
      data = null;
    }
    g.__vaanixLocalStore = data || initialStore();
  }
  return g.__vaanixLocalStore as Store;
}

function persist() {
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    const tmp = `${DB_PATH}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(store()));
    fs.renameSync(tmp, DB_PATH);
  } catch (err) {
    console.warn('[local-db] could not write store:', err);
  }
}

const PK: Record<string, string> = { cyber_cells: 'state_code', rate_limits: 'key' };

function withDefaults(table: string, input: Row): Row {
  const base: Row = {};
  if (!PK[table]) base.id = uuid();
  if (table !== 'cyber_cells' && table !== 'rate_limits') base.created_at = nowIso();
  const perTable: Record<string, Row> = {
    checks: { source: 'web_mic', caller_e164: null, voice_score: 0, text_score: 0, risk_score: 0, is_stub: false, transcript: null, transcript_lang: null, transcript_segments: [], scam_groups: [], scam_words: [], scam_type: null, claim_type: null, claim_label: null, claimed_member_id: null, audio_path: null, audio_sha256: null, timings_ms: {} },
    alerts: { status: 'open', impersonated_member_id: null, member_response: null, updated_at: nowIso() },
    alert_messages: { telegram_message_id: null, ok: false, error: null, sent_at: nowIso() },
    complaints: { payload: {} },
    radar_reports: { check_id: null, scam_type: null, excluded: false },
    api_clients: { scopes: ['checks:create', 'checks:read'], revoked_at: null, last_used_at: null, request_count: 0 },
    family_members: { aliases: [], telegram_chat_id: null, join_token: hex(), joined_at: null },
    profiles: { display_name: null, phone_e164: null, state_code: null, bank_id: null, telegram_chat_id: null, telegram_link_token: hex() },
    rate_limits: { count: 1 },
  };
  return { ...base, ...(perTable[table] || {}), ...input };
}

const clone = <T,>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

type Op = 'select' | 'insert' | 'update' | 'delete' | 'upsert';

class LocalQuery implements PromiseLike<any> {
  private op: Op = 'select';
  private payload: any;
  private preds: Array<(r: Row) => boolean> = [];
  private sorts: Array<{ col: string; asc: boolean }> = [];
  private lim: number | undefined;
  private rangeFrom: number | undefined;
  private rangeTo: number | undefined;
  private returning = true;
  private wantCount = false;
  private mode: 'many' | 'single' | 'maybe' = 'many';

  constructor(private table: string) {}

  select(_cols?: string, opts?: { count?: string; head?: boolean }) {
    if (this.op !== 'select') this.returning = true;
    if (opts?.count) this.wantCount = true;
    return this;
  }
  insert(payload: any) { this.op = 'insert'; this.payload = payload; this.returning = false; return this; }
  upsert(payload: any) { this.op = 'upsert'; this.payload = payload; this.returning = false; return this; }
  update(payload: any) { this.op = 'update'; this.payload = payload; this.returning = false; return this; }
  delete() { this.op = 'delete'; this.returning = false; return this; }

  eq(col: string, val: any) { this.preds.push((r) => r[col] === val); return this; }
  neq(col: string, val: any) { this.preds.push((r) => r[col] !== val); return this; }
  gt(col: string, val: any) { this.preds.push((r) => r[col] > val); return this; }
  gte(col: string, val: any) { this.preds.push((r) => r[col] >= val); return this; }
  lt(col: string, val: any) { this.preds.push((r) => r[col] < val); return this; }
  lte(col: string, val: any) { this.preds.push((r) => r[col] <= val); return this; }
  is(col: string, val: any) { this.preds.push((r) => (val === null ? r[col] == null : r[col] === val)); return this; }
  in(col: string, vals: any[]) { this.preds.push((r) => vals.includes(r[col])); return this; }
  filter(col: string, op: string, val: any) {
    const ops: Record<string, (a: any, b: any) => boolean> = {
      eq: (a, b) => a === b, neq: (a, b) => a !== b, gt: (a, b) => a > b,
      gte: (a, b) => a >= b, lt: (a, b) => a < b, lte: (a, b) => a <= b,
    };
    const fn = ops[op] || ops.eq;
    this.preds.push((r) => fn(r[col], val));
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) { this.sorts.push({ col, asc: opts?.ascending !== false }); return this; }
  limit(n: number) { this.lim = n; return this; }
  range(from: number, to: number) { this.rangeFrom = from; this.rangeTo = to; return this; }
  single() { this.mode = 'single'; return this; }
  maybeSingle() { this.mode = 'maybe'; return this; }

  private run() {
    const all = store();
    const rows = (all[this.table] ||= []);
    const match = (r: Row) => this.preds.every((p) => p(r));
    let out: Row[] = [];

    if (this.op === 'insert') {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      out = items.map((i: Row) => withDefaults(this.table, i));
      rows.push(...out);
    } else if (this.op === 'upsert') {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      const key = PK[this.table] || 'id';
      for (const i of items) {
        const existing = i[key] !== undefined ? rows.find((r) => r[key] === i[key]) : undefined;
        if (existing) { Object.assign(existing, i); out.push(existing); }
        else { const created = withDefaults(this.table, i); rows.push(created); out.push(created); }
      }
    } else if (this.op === 'update') {
      out = rows.filter(match);
      out.forEach((r) => Object.assign(r, this.payload));
    } else if (this.op === 'delete') {
      out = rows.filter(match);
      all[this.table] = rows.filter((r) => !out.includes(r));
    } else {
      out = rows.filter(match);
    }
    if (this.op !== 'select') persist();

    for (const s of [...this.sorts].reverse()) {
      out = [...out].sort((a, b) => (a[s.col] === b[s.col] ? 0 : (a[s.col] > b[s.col] ? 1 : -1) * (s.asc ? 1 : -1)));
    }
    const total = out.length;
    if (this.rangeFrom !== undefined) out = out.slice(this.rangeFrom, (this.rangeTo ?? total) + 1);
    if (this.lim !== undefined) out = out.slice(0, this.lim);

    if (!this.returning && this.op !== 'select') return { data: null, error: null, count: null };
    const count = this.wantCount ? total : null;
    const noRow = { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' };
    if (this.mode === 'single') {
      return out.length === 1 ? { data: clone(out[0]), error: null, count } : { data: null, error: noRow, count };
    }
    if (this.mode === 'maybe') {
      if (out.length > 1) return { data: null, error: noRow, count };
      return { data: out[0] ? clone(out[0]) : null, error: null, count };
    }
    return { data: clone(out), error: null, count };
  }

  then<R1 = any, R2 = never>(
    onfulfilled?: ((value: any) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: any) => R2 | PromiseLike<R2>) | null
  ): PromiseLike<R1 | R2> {
    return Promise.resolve().then(() => this.run()).then(onfulfilled, onrejected);
  }
}

export function createLocalClient(): any {
  return {
    from: (table: string) => new LocalQuery(table),
    rpc: async () => ({ data: null, error: null }),
    auth: {
      getUser: async () => ({ data: { user: LOCAL_USER }, error: null }),
      getSession: async () => ({ data: { session: { user: LOCAL_USER } }, error: null }),
      signOut: async () => ({ error: null }),
      exchangeCodeForSession: async () => ({ data: {}, error: null }),
      admin: { deleteUser: async () => ({ data: {}, error: null }) },
    },
    storage: {
      from: (bucket: string) => ({
        upload: async (filePath: string, body: Blob | ArrayBuffer | Uint8Array) => {
          try {
            const target = path.join(EVIDENCE_DIR, bucket, filePath);
            fs.mkdirSync(path.dirname(target), { recursive: true });
            const bytes = body instanceof Blob ? new Uint8Array(await body.arrayBuffer()) : new Uint8Array(body as ArrayBuffer);
            fs.writeFileSync(target, bytes);
            return { data: { path: filePath }, error: null };
          } catch (err) {
            return { data: null, error: { message: String(err) } };
          }
        },
        remove: async () => ({ data: [], error: null }),
        createSignedUrl: async () => ({ data: null, error: { message: 'Signed URLs are not available with local storage.' } }),
      }),
    },
  };
}
