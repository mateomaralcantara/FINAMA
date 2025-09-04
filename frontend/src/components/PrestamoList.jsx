import React from "react";
import {
  Card, CardHeader, CardBody, Heading, Table, Thead, Tbody, Tr, Th, Td,
  Button, Badge
} from "@chakra-ui/react";

const fmt = (n) => Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function PrestamoList({ prestamos, onSelect }) {
  return (
    <Card shadow="soft" borderRadius="2xl">
      <CardHeader><Heading size="md">Préstamos</Heading></CardHeader>
      <CardBody>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Monto</Th><Th>Cuotas</Th><Th>Frecuencia</Th><Th>Saldo</Th><Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {prestamos?.length ? prestamos.map(p => (
              <Tr key={p.id}>
                <Td>${fmt(p.monto)}</Td>
                <Td>
                  <Badge colorScheme="purple">
                    {p.cuotas_pagadas ?? 0}/{p.cuotas}
                  </Badge>
                </Td>
                <Td>
                  <Badge colorScheme="teal" variant="subtle" textTransform="capitalize">
                    {p.frecuencia}
                  </Badge>
                </Td>
                <Td fontWeight="semibold">${fmt(p.saldo)}</Td>
                <Td textAlign="right">
                  <Button size="sm" colorScheme="purple" variant="outline" onClick={() => onSelect?.(p)}>
                    Ver mensaje
                  </Button>
                </Td>
              </Tr>
            )) : (
              <Tr><Td colSpan={5} opacity={0.7}>Sin préstamos aún</Td></Tr>
            )}
          </Tbody>
        </Table>
      </CardBody>
    </Card>
  );
}
