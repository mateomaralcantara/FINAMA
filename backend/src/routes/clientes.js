const express = require('express');
const router = express.Router();

module.exports = (supabase) => {
  // Listar clientes
  router.get('/', async (req, res) => {
    const { data, error } = await supabase.from('clientes').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // Registrar nuevo cliente
  router.post('/', async (req, res) => {
    const { nombre, email, telefono } = req.body;
    const { data, error } = await supabase.from('clientes').insert([
      { nombre, email, telefono }
    ]).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
  });

  // Obtener cliente específico
  router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('clientes').select('*').eq('id', id).single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  return router;
};
