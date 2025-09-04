import React from "react";
import { Box, Container } from "@chakra-ui/react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";

export default function App() {
  return (
    <Box minH="100%">
      <Container maxW="6xl">
        <Navbar />
        <Home />
      </Container>
    </Box>
  );
}
