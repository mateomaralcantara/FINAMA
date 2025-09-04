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
const round2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;
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

// Ruta de prueba para verificar conexión a Supabase
app.get('/test-connection', asyncH(async (req, res) => {
  try {
    const { data, error } = await req.sb.from('clientes').select('count', { count: 'exact', head: true });
    if (error) {
      return res.json({ 
        connected: false, 
        error: error.message,
        suggestion: "Ejecutar el SQL schema en Supabase" 
      });
    }
    res.json({ connected: true, tables: 'OK' });
  } catch (e) {
    res.json({ 
      connected: false, 
      error: e.message,
      suggestion: "Verificar credenciales de Supabase" 
    });
  }
}));

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
  try {
    const { field, dir } = parseOrd(req.query);
    const { limit, offset } = parsePag(req.query);

    let q = req.sb.from('clientes').select('*', { count: 'exact' }).order(field, dir);
    if (limit || offset) q = q.range(offset, offset + limit - 1);

    const { data, error, count } = await q;
    if (error) {
      // Si la tabla no existe, devolver datos de demostración
      if (error.message.includes('table') && error.message.includes('not found')) {
        return res.json({ 
          count: 3, 
          items: [
            { id: 1, nombre: 'Juan Pérez', email: 'juan@example.com', telefono: '555-0101' },
            { id: 2, nombre: 'María González', email: 'maria@example.com', telefono: '555-0102' },
            { id: 3, nombre: 'Carlos López', email: 'carlos@example.com', telefono: '555-0103' }
          ],
          demo: true,
          message: 'Datos de demostración - Ejecutar SQL en Supabase para datos reales'
        });
      }
      return errJson(res, error);
    }
    res.json({ count, items: data || [] });
  } catch (e) {
    return errJson(res, e);
  }
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
  try {
    const { field, dir } = parseOrd(req.query);
    const { limit, offset } = parsePag(req.query);
    const clienteId = req.query.cliente_id ? num(req.query.cliente_id) : null;

    let q = req.sb.from('prestamos').select('*', { count: 'exact' }).order(field, dir);
    if (!Number.isNaN(clienteId) && clienteId !== null) q = q.eq('cliente_id', clienteId);
    if (limit || offset) q = q.range(offset, offset + limit - 1);

    const { data, error, count } = await q;
    if (error) {
      // Si la tabla no existe, devolver datos de demostración
      if (error.message.includes('table') && error.message.includes('not found')) {
        const prestamosDemo = [
          { 
            id: 1, 
            cliente_id: 1, 
            monto: 10000, 
            tasa: 12, 
            cuotas: 12, 
            frecuencia: 'mensual', 
            saldo: 8500,
            fecha_inicio: '2024-01-15',
            cuotas_pagadas: 3
          },
          { 
            id: 2, 
            cliente_id: 2, 
            monto: 5000, 
            tasa: 15, 
            cuotas: 6, 
            frecuencia: 'quincenal', 
            saldo: 3000,
            fecha_inicio: '2024-02-01',
            cuotas_pagadas: 2
          }
        ];
        
        const filteredData = clienteId ? prestamosDemo.filter(p => p.cliente_id === clienteId) : prestamosDemo;
        
        return res.json({ 
          count: filteredData.length, 
          items: filteredData,
          demo: true,
          message: 'Datos de demostración - Ejecutar SQL en Supabase para datos reales'
        });
      }
      return errJson(res, error);
    }
    res.json({ count, items: data || [] });
  } catch (e) {
    return errJson(res, e);
  }
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

/* ========= Solicitudes de Préstamos ========= */
// GET /solicitudes - Listar todas las solicitudes
app.get('/solicitudes', asyncH(async (req, res) => {
  const { field, dir } = parseOrd(req.query);
  const { limit, offset } = parsePag(req.query);
  const estado = req.query.estado || null;

  let q = req.sb.from('solicitudes_prestamos').select(`
    *,
    clientes:cliente_id(nombre, email, telefono),
    prestamos:prestamo_original_id(monto, saldo)
  `, { count: 'exact' }).order(field, dir);
  
  if (estado) q = q.eq('estado', estado);
  if (limit || offset) q = q.range(offset, offset + limit - 1);

  const { data, error, count } = await q;
  if (error) return errJson(res, error);
  res.json({ count, items: data || [] });
}));

// POST /solicitudes - Crear nueva solicitud
app.post('/solicitudes', asyncH(async (req, res) => {
  const miss = required(req.body, ['tipo_solicitud', 'monto', 'tasa', 'cuotas', 'frecuencia']);
  if (miss) return errJson(res, `Falta el campo: ${miss}`, 400);

  const {
    tipo_solicitud, // 'nuevo_cliente' | 'prestamo_adicional' | 'renovacion'
    cliente_id = null,
    prestamo_original_id = null,
    monto, tasa, cuotas, frecuencia,
    // Datos de cliente nuevo (si aplica)
    nombre_solicitante = null,
    email_solicitante = null,
    telefono_solicitante = null,
    ingresos_mensuales = null,
    referencias = null,
    motivo_solicitud = null
  } = req.body;

  // Validaciones según tipo
  if (tipo_solicitud === 'nuevo_cliente') {
    const missNew = required(req.body, ['nombre_solicitante', 'email_solicitante']);
    if (missNew) return errJson(res, `Para nuevo cliente falta: ${missNew}`, 400);
  } else if (['prestamo_adicional', 'renovacion'].includes(tipo_solicitud)) {
    if (!cliente_id) return errJson(res, 'cliente_id requerido para este tipo', 400);
  }

  const insertObj = {
    tipo_solicitud,
    cliente_id,
    prestamo_original_id,
    monto: num(monto),
    tasa: num(tasa),
    cuotas: num(cuotas),
    frecuencia,
    estado: 'pendiente',
    nombre_solicitante,
    email_solicitante,
    telefono_solicitante,
    ingresos_mensuales: ingresos_mensuales ? num(ingresos_mensuales) : null,
    referencias,
    motivo_solicitud,
    fecha_solicitud: new Date().toISOString()
  };

  const { data, error } = await req.sb
    .from('solicitudes_prestamos')
    .insert([insertObj])
    .select()
    .single();

  if (error) return errJson(res, error);
  res.status(201).json(data);
}));

// PATCH /solicitudes/:id - Aprobar/Rechazar solicitud
app.patch('/solicitudes/:id', asyncH(async (req, res) => {
  const solicitudId = num(req.params.id);
  const { estado, comentarios = null } = req.body;

  if (!['aprobada', 'rechazada', 'en_revision'].includes(estado)) {
    return errJson(res, 'Estado inválido', 400);
  }

  // Obtener la solicitud
  const { data: solicitud, error: fetchError } = await req.sb
    .from('solicitudes_prestamos')
    .select('*')
    .eq('id', solicitudId)
    .single();

  if (fetchError) return errJson(res, fetchError);

  // Actualizar estado
  const { data: updated, error: updateError } = await req.sb
    .from('solicitudes_prestamos')
    .update({ 
      estado, 
      comentarios,
      fecha_procesamiento: new Date().toISOString()
    })
    .eq('id', solicitudId)
    .select()
    .single();

  if (updateError) return errJson(res, updateError);

  // Si se aprueba, crear cliente y/o préstamo según corresponda
  if (estado === 'aprobada') {
    let clienteId = solicitud.cliente_id;

    // Crear cliente nuevo si es necesario
    if (solicitud.tipo_solicitud === 'nuevo_cliente') {
      const { data: nuevoCliente, error: clienteError } = await req.sb
        .from('clientes')
        .insert([{
          nombre: solicitud.nombre_solicitante,
          email: solicitud.email_solicitante,
          telefono: solicitud.telefono_solicitante
        }])
        .select()
        .single();

      if (clienteError) return errJson(res, clienteError);
      clienteId = nuevoCliente.id;
    }

    // Crear préstamo
    const { resumen } = buildSchedule({
      monto: solicitud.monto,
      tasa: solicitud.tasa,
      cuotas: solicitud.cuotas,
      frecuencia: solicitud.frecuencia,
      metodo: 'flat_mensual'
    });

    const prestamoObj = {
      cliente_id: clienteId,
      monto: solicitud.monto,
      tasa: solicitud.tasa,
      cuotas: solicitud.cuotas,
      frecuencia: solicitud.frecuencia,
      saldo: solicitud.monto,
      fecha_inicio: new Date().toISOString().split('T')[0],
      solicitud_origen_id: solicitudId
    };

    const { data: prestamo, error: prestamoError } = await req.sb
      .from('prestamos')
      .insert([prestamoObj])
      .select()
      .single();

    if (prestamoError) return errJson(res, prestamoError);

    res.json({ 
      solicitud: updated, 
      cliente_id: clienteId,
      prestamo: prestamo 
    });
  } else {
    res.json({ solicitud: updated });
  }
}));

/* ========= Renovaciones ========= */
// POST /prestamos/:id/renovar - Renovar préstamo existente
app.post('/prestamos/:id/renovar', asyncH(async (req, res) => {
  const prestamoId = num(req.params.id);
  const { nuevo_monto = null, nueva_tasa = null, nuevas_cuotas = null } = req.body;

  // Obtener préstamo original
  const { data: prestamoOriginal, error: fetchError } = await req.sb
    .from('prestamos')
    .select('*')
    .eq('id', prestamoId)
    .single();

  if (fetchError) return errJson(res, fetchError);

  // Usar valores del préstamo original si no se especifican nuevos
  const montoRenovacion = nuevo_monto ? num(nuevo_monto) : prestamoOriginal.monto;
  const tasaRenovacion = nueva_tasa ? num(nueva_tasa) : prestamoOriginal.tasa;
  const cuotasRenovacion = nuevas_cuotas ? num(nuevas_cuotas) : prestamoOriginal.cuotas;

  // Crear solicitud de renovación
  const solicitudRenovacion = {
    tipo_solicitud: 'renovacion',
    cliente_id: prestamoOriginal.cliente_id,
    prestamo_original_id: prestamoId,
    monto: montoRenovacion,
    tasa: tasaRenovacion,
    cuotas: cuotasRenovacion,
    frecuencia: prestamoOriginal.frecuencia,
    estado: 'pendiente',
    motivo_solicitud: 'Renovación de préstamo existente',
    fecha_solicitud: new Date().toISOString()
  };

  const { data, error } = await req.sb
    .from('solicitudes_prestamos')
    .insert([solicitudRenovacion])
    .select()
    .single();

  if (error) return errJson(res, error);
  res.status(201).json({ mensaje: 'Solicitud de renovación creada', solicitud: data });
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

// Dashboard general con métricas
app.get('/dashboard', asyncH(async (req, res) => {
  try {
    const [clientesRes, prestamosRes, solicitudesRes, pagosRes] = await Promise.all([
      req.sb.from('clientes').select('*', { count: 'exact', head: true }),
      req.sb.from('prestamos').select('*'),
      req.sb.from('solicitudes_prestamos').select('*'),
      req.sb.from('pagos').select('*')
    ]);

    const totalClientes = clientesRes.count || 0;
    const prestamos = prestamosRes.data || [];
    const solicitudes = solicitudesRes.data || [];
    const pagos = pagosRes.data || [];

    const saldoTotal = prestamos.reduce((acc, p) => acc + Number(p.saldo || 0), 0);
    const montoTotal = prestamos.reduce((acc, p) => acc + Number(p.monto || 0), 0);
    const totalPagado = pagos.reduce((acc, p) => acc + Number(p.monto || 0), 0);

    const solicitudesPendientes = solicitudes.filter(s => s.estado === 'pendiente').length;
    const solicitudesAprobadas = solicitudes.filter(s => s.estado === 'aprobada').length;

    res.json({
      totalClientes,
      totalPrestamos: prestamos.length,
      saldoTotal: round2(saldoTotal),
      montoTotal: round2(montoTotal),
      totalPagado: round2(totalPagado),
      solicitudesPendientes,
      solicitudesAprobadas,
      solicitudesTotal: solicitudes.length
    });
  } catch (error) {
    // Si hay error de tablas, devolver datos de demostración
    res.json({
      totalClientes: 3,
      totalPrestamos: 2,
      saldoTotal: 11500,
      montoTotal: 15000,
      totalPagado: 3500,
      solicitudesPendientes: 2,
      solicitudesAprobadas: 1,
      solicitudesTotal: 3,
      demo: true,
      message: 'Datos de demostración - Ejecutar SQL en Supabase para datos reales'
    });
  }
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
