const math = require('mathjs');
// Aquí puedes usar también simple-statistics, dayjs, etc

function analisisFinanciero(prestamos) {
  if (!prestamos.length) return {};

  const saldoTotal = prestamos.reduce((acc, p) => acc + p.saldo, 0);

  // Ejemplo de uso de mathjs
  const montos = prestamos.map(p => p.monto);
  const promedio = math.mean(montos);
  const desviacion = math.std(montos);

  return {
    saldoTotal,
    promedioPrestamo: promedio,
    desviacionMontos: desviacion,
    cantidadPrestamos: prestamos.length,
    // ...aquí puedes agregar riesgo, cuotas pendientes, proyecciones, etc
  };
}

module.exports = {
  analisisFinanciero
};
