const express = require('express');
const router = express.Router();

module.exports = (supabase) => {
  // Listar pagos (por préstamo opcional)
  router.get('/', async (req, res) => {
    const { prestamo_id } = req.query;
    let query = supabase.from('pagos').select('*');
    if (prestamo_id) query = query.eq('prestamo_id', prestamo_id);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // Registrar pago
  router.post('/', async (req, res) => {
    const { prestamo_id, fecha_pago, monto } = req.body;
    const { data, error } = await supabase.from('pagos').insert([
      { prestamo_id, fecha_pago, monto }
    ]).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
  });

  // Obtener pago específico
  router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('pagos').select('*').eq('id', id).single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  return router;
};
