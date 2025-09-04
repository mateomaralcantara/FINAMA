import React, { useState } from "react";
import { Card, CardHeader, CardBody, Heading, VStack, HStack, Input, Select, Button, Table, Thead, Tr, Th, Tbody, Td, Stat, StatLabel, StatNumber, SimpleGrid, useToast } from "@chakra-ui/react";
import axios from "axios";
import { API } from "../config";

export default function CalculadoraPrestamo() {
  const [form, setForm] = useState({
    monto: 25000,
    tasa: 10,
    tipoTasa: "periodo",      // 10% mensual
    frecuencia: "semanal",
    cuotas: 13,
    metodo: "flat_mensual",   // << nuevo default
    fecha_inicio: "",
  });
  
  const [resumen, setResumen] = useState(null);
  const [plan, setPlan] = useState([]);
  const toast = useToast();

  const onChange = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const calcular = async () => {
    try {
      const { data } = await axios.post(`${API}/calcular-prestamo`, {
        ...form,
        monto: Number(form.monto),
        tasa: Number(form.tasa),
        cuotas: Number(form.cuotas),
      });
      setResumen(data.resumen);
      setPlan(data.plan);
    } catch (e) {
      console.error(e);
      toast({ status: "error", title: e?.response?.data?.error || "Error calculando" });
    }
  };

  const fmt = (n) => Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <VStack align="stretch" spacing={6}>
      <Card borderRadius="2xl">
        <CardHeader><Heading size="md">Calculadora de Préstamo</Heading></CardHeader>
        <CardBody>
          <VStack align="stretch" spacing={3}>
            <HStack>
              <Input type="number" placeholder="Monto" value={form.monto} onChange={onChange("monto")} />
              <Input type="number" placeholder="% interés" value={form.tasa} step="0.0001" onChange={onChange("tasa")} />
            </HStack>
            <HStack>
              <Select value={form.tipoTasa} onChange={onChange("tipoTasa")}>
                <option value="periodo">Tasa por período</option>
                <option value="anual">Tasa anual</option>
              </Select>
              <Select value={form.frecuencia} onChange={onChange("frecuencia")}>
                <option value="diario">Diario</option>
                <option value="semanal">Semanal</option>
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
              </Select>
              <Input type="number" placeholder="Cuotas" value={form.cuotas} onChange={onChange("cuotas")} />
            </HStack>
            <HStack>
              <Select value={form.metodo} onChange={onChange("metodo")}>
                <option value="frances">Cuota fija (francés)</option>
                <option value="simple">Interés simple</option>
              </Select>
              <Input type="date" value={form.fecha_inicio} onChange={onChange("fecha_inicio")} />
              <Button colorScheme="teal" onClick={calcular}>Calcular</Button>
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {resumen && (
        <Card borderRadius="2xl">
          <CardHeader><Heading size="md">Resumen</Heading></CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              <Stat><StatLabel>Cuota</StatLabel><StatNumber>${fmt(resumen.cuota)}</StatNumber></Stat>
              <Stat><StatLabel>Tasa por período</StatLabel><StatNumber>{fmt(resumen.tasa_periodo)}%</StatNumber></Stat>
              <Stat><StatLabel>Total intereses</StatLabel><StatNumber>${fmt(resumen.total_intereses)}</StatNumber></Stat>
              <Stat><StatLabel>Total a pagar</StatLabel><StatNumber>${fmt(resumen.total_a_pagar)}</StatNumber></Stat>
            </SimpleGrid>
          </CardBody>
        </Card>
      )}

      {plan?.length > 0 && (
        <Card borderRadius="2xl">
          <CardHeader><Heading size="md">Cronograma</Heading></CardHeader>
          <CardBody>
            <Table size="sm" variant="simple">
              <Thead>
                <Tr>
                  <Th>#</Th><Th>Fecha</Th><Th isNumeric>Cuota</Th><Th isNumeric>Interés</Th><Th isNumeric>Capital</Th><Th isNumeric>Saldo</Th>
                </Tr>
              </Thead>
              <Tbody>
                {plan.map(row => (
                  <Tr key={row.n}>
                    <Td>{row.n}</Td>
                    <Td>{row.fecha}</Td>
                    <Td isNumeric>{fmt(row.cuota)}</Td>
                    <Td isNumeric>{fmt(row.interes)}</Td>
                    <Td isNumeric>{fmt(row.capital)}</Td>
                    <Td isNumeric>{fmt(row.saldo)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      )}
    </VStack>
  );
}
