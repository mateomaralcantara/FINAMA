import { extendTheme } from "@chakra-ui/react";

const config = {
  initialColorMode: "system",
  useSystemColorMode: true,
};

const theme = extendTheme({
  config,
  fonts: {
    heading: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    body: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  },
  styles: {
    global: {
      "html, body, #root": { height: "100%" },
      body: { bg: "gray.50", _dark: { bg: "gray.900" } },
    },
  },
  radii: { xl: "16px", "2xl": "24px" },
  shadows: { soft: "0 10px 30px rgba(0,0,0,0.06)" },
});

export default theme;
