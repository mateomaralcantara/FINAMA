import React from "react";
import { Alert, AlertIcon, AlertTitle, AlertDescription, Collapse } from "@chakra-ui/react";

export default function MensajeAlerta({ mensaje }) {
  return (
    <Collapse in={Boolean(mensaje)} animateOpacity>
      {mensaje && (
        <Alert status="warning" variant="subtle" borderRadius="2xl">
          <AlertIcon />
          <AlertTitle mr={2}>Mensaje listo:</AlertTitle>
          <AlertDescription>{mensaje}</AlertDescription>
        </Alert>
      )}
    </Collapse>
  );
}
