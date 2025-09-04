import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Heading,
  VStack,
  Input,
  Select,
  Button,
  useToast,
  Text,
} from "@chakra-ui/react";
import axios from "axios";
import { API } from "../config";

export default function PrestamoForm({ cliente, onSuccess }) {
  const [monto, setMonto] = useState("");
  const [cuotas, setCuotas] = useState("");
  const [tasa, setTasa] = useState("");
  const [frecuencia, setFrecuencia] = useState("semanal"); // para tu caso típico
  const [metodo, setMetodo] = useState("flat_mensual");    // << nuevo default
  const [tipoTasa, setTipoTasa] = useState("periodo");     // "periodo" = mensual; "anual" convierte a mensual
  const [fechaInicio, setFechaInicio] = useState("");
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    if (!cliente?.id) {
      return toast({ status: "warning", title: "Selecciona un cliente primero" });
    }
    try {
      await axios.post(`${API}/prestamos`, {
        cliente_id: cliente.id,
        monto: Number(monto),
        cuotas: Number(cuotas),
        tasa: Number(tasa),
        frecuencia,
        metodo,           // << se envía al backend
        tipoTasa,         // << se envía al backend
        fecha_inicio: fechaInicio || null,
      });

      // reset
      setMonto("");
      setCuotas("");
      setTasa("");
      setFrecuencia("semanal");
      setMetodo("flat_mensual");
      setTipoTasa("periodo");
      setFechaInicio("");

      toast({ status: "success", title: "Préstamo creado" });
      onSuccess?.();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.error || "Error creando préstamo";
      toast({ status: "error", title: msg });
    }
  };

  return (
    <Card shadow="soft" borderRadius="2xl">
      <CardHeader>
        <Heading size="md">Nuevo Préstamo</Heading>
        <Text fontSize="sm" opacity={0.7}>
          Cliente: {cliente?.nombre || "—"}
        </Text>
      </CardHeader>

      <CardBody as="form" onSubmit={submit}>
        <VStack spacing={3} align="stretch">
          <Input
            placeholder="Monto"
            type="number"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            required
          />

          <Input
            placeholder="Cuotas"
            type="number"
            value={cuotas}
            onChange={(e) => setCuotas(e.target.value)}
            required
          />

          <Input
            placeholder="Tasa (%)"
            type="number"
            step="0.01"
            value={tasa}
            onChange={(e) => setTasa(e.target.value)}
            required
          />

          {/* Tipo de tasa */}
          <Select value={tipoTasa} onChange={(e) => setTipoTasa(e.target.value)}>
            <option value="periodo">Tasa por período (mensual)</option>
            <option value="anual">Tasa anual (se convierte a mensual)</option>
          </Select>

          {/* Frecuencia */}
          <Select value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)}>
            <option value="mensual">Mensual</option>
            <option value="quincenal">Quincenal</option>
            <option value="semanal">Semanal</option>
            <option value="diario">Diario</option>
          </Select>

          {/* Método de cálculo */}
          <Select value={metodo} onChange={(e) => setMetodo(e.target.value)}>
            <option value="flat_mensual">Interés plano mensual equivalente</option>
            <option value="frances">Francés (cuota fija)</option>
            <option value="simple">Simple (interés fijo por período)</option>
          </Select>

          {/* Fecha de inicio */}
          <Input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />

          <Button colorScheme="teal" type="submit" isDisabled={!cliente?.id}>
            Guardar
          </Button>
        </VStack>
      </CardBody>
    </Card>
  );
}
