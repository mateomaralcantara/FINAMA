const express = require('express');
const router = express.Router();

module.exports = (supabase) => {
  // Listar préstamos (por cliente opcional)
  router.get('/', async (req, res) => {
    const { cliente_id } = req.query;
    let query = supabase.from('prestamos').select('*');
    if (cliente_id) query = query.eq('cliente_id', cliente_id);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // Registrar nuevo préstamo
  router.post('/', async (req, res) => {
    const { cliente_id, monto, tasa, cuotas, frecuencia } = req.body;
    const { data, error } = await supabase.from('prestamos').insert([
      { cliente_id, monto, tasa, cuotas, frecuencia, saldo: monto }
    ]).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
  });

  // Obtener préstamo específico
  router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('prestamos').select('*').eq('id', id).single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  return router;
};
