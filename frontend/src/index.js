import React from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import theme from "./theme";
import App from "./App";

const mount = document.getElementById("root");
if (!mount) {
  throw new Error(
    "No se encontró #root. Asegúrate de tener public/index.html con <div id=\"root\"></div>."
  );
}

createRoot(mount).render(
  <React.StrictMode>
    <ColorModeScript initialColorMode={theme.config?.initialColorMode} />
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>
);
