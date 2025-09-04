import React from "react";
import { Flex, Heading, Spacer, IconButton, useColorMode, Tooltip } from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";

export default function Navbar() {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <Flex as="header" align="center" py={4} px={2}>
      <Heading size="md">FinaMa • Control Financiero</Heading>
      <Spacer />
      <Tooltip label={colorMode === "light" ? "Modo oscuro" : "Modo claro"}>
        <IconButton
          aria-label="toggle color mode"
          onClick={toggleColorMode}
          icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
          variant="ghost"
        />
      </Tooltip>
    </Flex>
  );
}
