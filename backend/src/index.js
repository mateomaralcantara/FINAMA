// backend/src/index.js
'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { buildSchedule } = require('./services/calculo');

const app = express();

/* ========= Config ========= */
const {
  SUPABASE_URL,
  SUPABASE_KEY,
  PORT = 3001,
  CORS_ORIGIN = 'http://localhost:3000',
} = process.env;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Faltan SUPABASE_URL o SUPABASE_KEY en .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ========= Middlewares ========= */
app.set('trust proxy', true);
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use((req, _res, next) => { req.sb = supabase; next(); });

// Preflight universal (Express 5 safe)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', CORS_ORIGIN);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.sendStatus(204);
  }
  next();
});

/* ========= Utils ========= */
const asyncH = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const errJson = (res, error, code = 500) => res.status(code).json({ error: (error?.message || error || 'Error') });
const required = (o, fields) => fields.find((f) => o[f] === undefined || o[f] === null || o[f] === '') || null;
const num = (v) => (v === '' || v === null || v === undefined ? NaN : Number(v));
const parseOrd = (q) => ({
  field: String(q.order || 'id'),
  dir: (String(q.dir || 'asc').toLowerCase() === 'desc') ? { ascending: false } : { ascending: true },
});
const parsePag = (q) => {
  const limit = Math.min(Math.max(parseInt(q.limit || '100', 10), 1), 500);
  const offset = Math.max(parseInt(q.offset || '0', 10), 0);
  return { limit, offset };
};

/* ========= Rutas base ========= */
app.get('/', (_req, res) => res.send('API OK'));
app.get('/health', (_req, res) => res.json({ ok: true, now: new Date().toISOString() }));

/* ========= Calculadora ========= */
// POST /calcular-prestamo  (solo calcular, NO guarda)
app.post('/calcular-prestamo', asyncH(async (req, res) => {
  const miss = required(req.body, ['monto', 'tasa', 'frecuencia', 'cuotas']);
  if (miss) return errJson(res, `Falta el campo: ${miss}`, 400);

  const out = buildSchedule({
    monto: num(req.body.monto),
    tasa: num(req.body.tasa),
    tipoTasa: req.body.tipoTasa || 'periodo',   // "periodo" = mensual directa, "anual" se convierte a mensual
    frecuencia: String(req.body.frecuencia),    // semanal/quincenal/mensual/diario
    cuotas: num(req.body.cuotas),
    metodo: 'flat_mensual',                     // forzado a tu regla
    fecha_inicio: req.body.fecha_inicio || null,
  });

  res.json(out);
}));

/* ========= Clientes ========= */
app.get('/clientes', asyncH(async (req, res) => {
  const { field, dir } = parseOrd(req.query);
  const { limit, offset } = parsePag(req.query);

  let q = req.sb.from('clientes').select('*', { count: 'exact' }).order(field, dir);
  if (limit || offset) q = q.range(offset, offset + limit - 1);

  const { data, error, count } = await q;
  if (error) return errJson(res, error);
  res.json({ count, items: data || [] });
}));

app.post('/clientes', asyncH(async (req, res) => {
  const miss = required(req.body, ['nombre', 'email']);
  if (miss) return errJson(res, `Falta el campo: ${miss}`, 400);

  const { nombre, email, telefono = null } = req.body;
  const { data, error } = await req.sb
    .from('clientes')
    .insert([{ nombre, email, telefono }])
    .select()
    .single();

  if (error) return errJson(res, error);
  res.status(201).json(data);
}));

/* ========= Préstamos ========= */
app.get('/prestamos', asyncH(async (req, res) => {
  const { field, dir } = parseOrd(req.query);
  const { limit, offset } = parsePag(req.query);
  const clienteId = req.query.cliente_id ? num(req.query.cliente_id) : null;

  let q = req.sb.from('prestamos').select('*', { count: 'exact' }).order(field, dir);
  if (!Number.isNaN(clienteId) && clienteId !== null) q = q.eq('cliente_id', clienteId);
  if (limit || offset) q = q.range(offset, offset + limit - 1);

  const { data, error, count } = await q;
  if (error) return errJson(res, error);
  res.json({ count, items: data || [] });
}));

// POST /prestamos  (calcula y guarda con tu regla)
app.post('/prestamos', asyncH(async (req, res) => {
  const miss = required(req.body, ['cliente_id', 'monto', 'tasa', 'cuotas', 'frecuencia']);
  if (miss) return errJson(res, `Falta el campo: ${miss}`, 400);

  const cliente_id = num(req.body.cliente_id);
  const monto = num(req.body.monto);
  const tasa = num(req.body.tasa);
  const cuotas = num(req.body.cuotas);
  const frecuencia = String(req.body.frecuencia);
  const tipoTasa = req.body.tipoTasa || 'periodo';
  const fecha_inicio = req.body.fecha_inicio || null;

  if ([cliente_id, monto, tasa, cuotas].some(Number.isNaN)) {
    return errJson(res, 'Tipos inválidos en numéricos (cliente_id, monto, tasa, cuotas).', 400);
  }

  // cálculo con tu regla (forzado)
  const { resumen, plan } = buildSchedule({
    monto, tasa, tipoTasa, frecuencia, cuotas, metodo: 'flat_mensual', fecha_inicio
  });

  // guardamos loan básico (puedes ampliar tu tabla si quieres persistir totales)
  const insertObj = {
    cliente_id,
    monto: resumen.monto,
    tasa,
    cuotas: resumen.cuotas,
    frecuencia: resumen.frecuencia,
    saldo: resumen.monto,         // saldo inicial = principal
    fecha_inicio: resumen.fecha_inicio,
  };

  const ins = await req.sb.from('prestamos').insert([insertObj]).select().single();
  if (ins.error) return errJson(res, ins.error);

  res.status(201).json({ prestamo: ins.data, resumen, plan });
}));

/* ========= Pagos ========= */
app.get('/pagos', asyncH(async (req, res) => {
  const { field, dir } = parseOrd(req.query);
  const { limit, offset } = parsePag(req.query);
  const prestamoId = req.query.prestamo_id ? num(req.query.prestamo_id) : null;

  let q = req.sb.from('pagos').select('*', { count: 'exact' }).order(field, dir);
  if (!Number.isNaN(prestamoId) && prestamoId !== null) q = q.eq('prestamo_id', prestamoId);
  if (limit || offset) q = q.range(offset, offset + limit - 1);

  const { data, error, count } = await q;
  if (error) return errJson(res, error);
  res.json({ count, items: data || [] });
}));

app.post('/pagos', asyncH(async (req, res) => {
  const miss = required(req.body, ['prestamo_id', 'monto']);
  if (miss) return errJson(res, `Falta el campo: ${miss}`, 400);

  const prestamo_id = num(req.body.prestamo_id);
  const monto = num(req.body.monto);
  const fecha_pago = req.body.fecha_pago || null;

  if ([prestamo_id, monto].some(Number.isNaN)) {
    return errJson(res, 'Tipos inválidos en numéricos (prestamo_id, monto).', 400);
  }

  const ins = await req.sb.from('pagos').insert([{ prestamo_id, monto, fecha_pago }]).select().single();
  if (ins.error) return errJson(res, ins.error);

  // intenta RPC para actualizar saldo
  try {
    await req.sb.rpc('registrar_pago', { p_prestamo_id: prestamo_id, p_monto: monto, p_fecha: fecha_pago });
  } catch {
    await req.sb.rpc('restar_saldo_prestamo', { p_prestamo_id: prestamo_id, p_monto: monto }).catch(() => null);
  }

  res.status(201).json({ pago: ins.data });
}));

/* ========= Análisis básico ========= */
let calculos = {};
try { calculos = require('./calculos'); }
catch { calculos = { analisisFinanciero: (p = []) => ({ saldoTotal: (p||[]).reduce((a,x)=>a+Number(x.saldo||0),0), cantidadPrestamos: (p||[]).length }) }; }

app.get('/analisis/:clienteId', asyncH(async (req, res) => {
  const clienteId = num(req.params.clienteId);
  if (Number.isNaN(clienteId)) return errJson(res, 'clienteId inválido', 400);

  const { data: prestamos, error } = await req.sb.from('prestamos').select('*').eq('cliente_id', clienteId);
  if (error) return errJson(res, error);

  const out = calculos.analisisFinanciero ? calculos.analisisFinanciero(prestamos || []) : {};
  res.json(out);
}));

/* ========= 404 & errores ========= */
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
app.use((err, _req, res, _next) => { console.error('🔥 Uncaught error:', err); errJson(res, err, 500); });

/* ========= Arranque & Shutdown ========= */
const server = app.listen(Number(PORT), () => console.log(`🚀 Backend corriendo en http://localhost:${PORT}`));

const shutdown = (sig) => () => {
  console.log(`\n${sig} recibido. Cerrando servidor...`);
  server.close(() => { console.log('✅ Server cerrado.'); process.exit(0); });
};
process.on('SIGINT', shutdown('SIGINT'));
process.on('SIGTERM', shutdown('SIGTERM'));
