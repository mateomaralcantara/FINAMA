// backend/src/services/calculo.js
const dayjs = require('dayjs');

// factor de meses equivalentes por frecuencia
const FREQ_MONTH_FACTOR = {
  mensual: 1,        // 1 cuota = 1 mes
  quincenal: 1 / 2,  // 2 quincenas = 1 mes
  semanal: 3 / 13,   // 13 semanas = 3 meses -> 1 sem = 3/13 mes
  diario: 1 / 30,    // 30 días ~ 1 mes
};

// helpers numéricos
const toNum = (x) => Number(x);
const round2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;
const isPos = (x) => typeof x === 'number' && Number.isFinite(x) && x > 0;

function nextDate(dateISO, freq, i) {
  const d = dayjs(dateISO || dayjs().format('YYYY-MM-DD'));
  const f = String(freq).toLowerCase();
  if (f === 'diario') return d.add(i, 'day').format('YYYY-MM-DD');
  if (f === 'semanal') return d.add(i, 'week').format('YYYY-MM-DD');
  if (f === 'quincenal') return d.add(i * 2, 'week').format('YYYY-MM-DD');
  if (f === 'mensual') return d.add(i, 'month').format('YYYY-MM-DD');
  throw new Error('Frecuencia inválida');
}

// convierte 10 -> 0.10 (mensual), o anual -> mensual equivalente
function tasaMensualDecimal(tasaPct, tipoTasa) {
  const r = toNum(tasaPct) / 100;
  if (!Number.isFinite(r) || r < 0) throw new Error('Tasa inválida');
  if ((tipoTasa || 'periodo') === 'anual') {
    // anual -> mensual equivalente (capitalización)
    return Math.pow(1 + r, 1 / 12) - 1;
  }
  // “periodo” = mensual directa
  return r;
}

/**
 * Método fijo: 'flat_mensual'
 * Regla:
 *  meses_equivalentes = cuotas * factor(frecuencia)
 *  interes_total     = monto * tasa_mensual * meses_equivalentes
 *  total_a_pagar     = monto + interes_total
 *  cuota             = total_a_pagar / cuotas
 *  interés por cuota = interes_total / cuotas
 *  capital por cuota = cuota - interés_por_cuota
 */
function scheduleFlatMensual({ monto, tasa, tipoTasa = 'periodo', frecuencia, cuotas, fecha_inicio }) {
  const P = toNum(monto);
  const N = toNum(cuotas);

  if (!isPos(P) || !isPos(N)) throw new Error('Monto/cuotas inválidos');

  const freq = String(frecuencia).toLowerCase();
  const factorMes = FREQ_MONTH_FACTOR[freq];
  if (!factorMes) throw new Error('Frecuencia inválida');

  const rMensual = tasaMensualDecimal(tasa, tipoTasa);
  const mesesEquivalentes = N * factorMes;

  // CÁLCULO CLAVE (tu regla)
  const interesTotal = P * rMensual * mesesEquivalentes;
  const totalPagar = P + interesTotal;
  const cuota = totalPagar / N;

  const interesPorCuota = interesTotal / N;
  const capitalConst = cuota - interesPorCuota;

  const plan = [];
  let saldo = P;

  for (let k = 1; k <= N; k++) {
    saldo = Math.max(0, round2(saldo - capitalConst));
    plan.push({
      n: k,
      fecha: nextDate(fecha_inicio, freq, k),
      cuota: round2(cuota),
      interes: round2(interesPorCuota),
      capital: round2(capitalConst),
      saldo: round2(saldo),
    });
  }

  return {
    resumen: {
      metodo: 'flat_mensual',
      monto: round2(P),
      tasa_mensual: round2(rMensual * 100), // en %
      meses_equivalentes: round2(mesesEquivalentes),
      cuotas: N,
      frecuencia: freq,
      cuota: round2(cuota),
      total_intereses: round2(interesTotal),
      total_a_pagar: round2(totalPagar),
      fecha_inicio: fecha_inicio || dayjs().format('YYYY-MM-DD'),
    },
    plan,
  };
}

// (Compat opcional) otros métodos si alguna vez los habilitas
function cuotaFrances(P, r, N) { return r === 0 ? P / N : (P * r) / (1 - Math.pow(1 + r, -N)); }
function ratePerPeriod(rate, rateType, freq) {
  const r = toNum(rate) / 100;
  if (!(r >= 0)) throw new Error('Tasa inválida');
  if ((rateType || 'periodo') === 'periodo') return r;   // r ya es tasa por período
  const porAnio = { diario: 360, semanal: 52, quincenal: 26, mensual: 12 };
  const n = porAnio[String(freq).toLowerCase()] || 12;
  return Math.pow(1 + r, 1 / n) - 1;
}

function buildSchedule(opts) {
  // Forzamos flat_mensual por defecto (y si te mandan otro, igual usamos flat)
  const metodo = (opts.metodo || 'flat_mensual').toLowerCase();
  if (metodo === 'flat_mensual' || !['frances', 'simple'].includes(metodo)) {
    return scheduleFlatMensual(opts);
  }

  // ↓ Mantengo compat si algún día lo quieres usar desde admin
  const { monto, tasa, tipoTasa = 'periodo', frecuencia, cuotas, fecha_inicio } = opts;
  const P = toNum(monto), N = toNum(cuotas);
  const r = ratePerPeriod(tasa, tipoTasa, frecuencia);

  if (metodo === 'frances') {
    const pago = cuotaFrances(P, r, N);
    let saldo = P, totalInteres = 0;
    const plan = [];
    for (let k = 1; k <= N; k++) {
      const interes = saldo * r;
      const capital = pago - interes;
      saldo = Math.max(0, round2(saldo - capital));
      plan.push({
        n: k, fecha: nextDate(fecha_inicio, frecuencia, k),
        cuota: round2(pago),
        interes: round2(interes),
        capital: round2(capital),
        saldo: round2(saldo),
      });
      totalInteres += interes;
    }
    return {
      resumen: {
        metodo: 'frances',
        monto: round2(P),
        tasa_periodo: round2(r * 100),
        cuotas: N, frecuencia,
        cuota: round2(pago),
        total_intereses: round2(totalInteres),
        total_a_pagar: round2(pago * N),
        fecha_inicio: fecha_inicio || dayjs().format('YYYY-MM-DD'),
      },
      plan,
    };
  }

  if (metodo === 'simple') {
    const interesPeriodo = P * r;
    const totalInteres = interesPeriodo * N;
    const pago = (P + totalInteres) / N;
    const capitalConst = P / N;
    const plan = [];
    let saldo = P;
    for (let k = 1; k <= N; k++) {
      saldo = Math.max(0, round2(saldo - capitalConst));
      plan.push({
        n: k, fecha: nextDate(fecha_inicio, frecuencia, k),
        cuota: round2(pago),
        interes: round2(interesPeriodo),
        capital: round2(capitalConst),
        saldo: round2(saldo),
      });
    }
    return {
      resumen: {
        metodo: 'simple',
        monto: round2(P),
        tasa_periodo: round2(r * 100),
        cuotas: N, frecuencia,
        cuota: round2(pago),
        total_intereses: round2(totalInteres),
        total_a_pagar: round2(pago * N),
        fecha_inicio: fecha_inicio || dayjs().format('YYYY-MM-DD'),
      },
      plan,
    };
  }

  throw new Error('Método inválido (flat_mensual|frances|simple)');
}

module.exports = { buildSchedule };
