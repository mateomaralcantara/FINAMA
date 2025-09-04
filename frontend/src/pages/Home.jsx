// frontend/src/pages/Home.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  SimpleGrid,
  Heading,
  useToast,
  Stack,
  Box,
} from "@chakra-ui/react";
import axios from "axios";
import { API } from "../config";
import ClienteList from "../components/ClienteList";
import ClienteForm from "../components/ClienteForm";
import PrestamoList from "../components/PrestamoList";
import PrestamoForm from "../components/PrestamoForm";
import MensajeAlerta from "../components/MensajeAlerta";
import CalculadoraPrestamo from "../components/CalculadoraPrestamo";

export default function Home() {
  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [prestamos, setPrestamos] = useState([]);
  const [selectedPrestamo, setSelectedPrestamo] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const toast = useToast();

  const fetchClientes = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/clientes`);
      // backend responde { count, items }
      setClientes(res.data?.items ?? []);
    } catch (e) {
      console.error(e);
      toast({ status: "error", title: "No se pudo cargar clientes" });
    }
  }, [toast]);

  const fetchPrestamos = useCallback(
    async (clienteId) => {
      if (!clienteId) return;
      try {
        const res = await axios.get(`${API}/prestamos?cliente_id=${clienteId}`);
        // backend responde { count, items }
        setPrestamos(res.data?.items ?? []);
      } catch (e) {
        console.error(e);
        toast({ status: "error", title: "No se pudo cargar préstamos" });
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const handleSelectCliente = (cliente) => {
    setSelectedCliente(cliente);
    setSelectedPrestamo(null);
    fetchPrestamos(cliente?.id);
  };

  const handleSelectPrestamo = (p) => {
    setSelectedPrestamo(p);
    const nombre = selectedCliente?.nombre ?? "cliente";
    const saldo = Number(p?.saldo ?? 0).toFixed(2);
    const cuotasPagadas = Number(p?.cuotas_pagadas ?? 0);
    const cuotasTotales = Number(p?.cuotas ?? 0);
    const restantes = p?.cuotas_restantes ?? Math.max(cuotasTotales - cuotasPagadas, 0);
    setMensaje(`Hola ${nombre}, tu saldo pendiente es $${saldo}. Te quedan ${restantes} cuotas.`);
  };

  return (
    <Stack spacing={8} pb={16}>
      <Heading size="lg" bgGradient="linear(to-r, teal.400, purple.400)" bgClip="text">
        Panel de Control
      </Heading>

      {/* Calculadora rápida arriba */}
      <Box>
        <CalculadoraPrestamo />
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <Box>
          <ClienteForm onSuccess={fetchClientes} />
        </Box>
        <Box gridColumn={{ base: "span 1", md: "span 2" }}>
          <ClienteList clientes={clientes} onSelect={handleSelectCliente} />
        </Box>
      </SimpleGrid>

      {selectedCliente && (
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Box>
            <PrestamoForm
              cliente={selectedCliente}
              onSuccess={() => fetchPrestamos(selectedCliente.id)}
            />
          </Box>
          <Box gridColumn={{ base: "span 1", md: "span 2" }}>
            <PrestamoList prestamos={prestamos} onSelect={handleSelectPrestamo} />
          </Box>
        </SimpleGrid>
      )}

      <MensajeAlerta mensaje={mensaje} />
    </Stack>
  );
}
