import React from "react";
import { Card, CardHeader, CardBody, Heading, Table, Thead, Tbody, Tr, Th, Td, Button } from "@chakra-ui/react";

export default function ClienteList({ clientes, onSelect }) {
  return (
    <Card shadow="soft" borderRadius="2xl">
      <CardHeader><Heading size="md">Clientes</Heading></CardHeader>
      <CardBody>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr><Th>Nombre</Th><Th>Email</Th><Th></Th></Tr>
          </Thead>
          <Tbody>
            {clientes?.length ? clientes.map(c => (
              <Tr key={c.id}>
                <Td>{c.nombre}</Td>
                <Td>{c.email}</Td>
                <Td textAlign="right">
                  <Button size="sm" colorScheme="purple" onClick={() => onSelect?.(c)}>Ver préstamos</Button>
                </Td>
              </Tr>
            )) : (
              <Tr><Td colSpan={3} opacity={0.7}>Sin clientes aún</Td></Tr>
            )}
          </Tbody>
        </Table>
      </CardBody>
    </Card>
  );
}
