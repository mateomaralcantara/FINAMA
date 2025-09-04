import React from "react";
import {
  Flex,
  Heading,
  Spacer,
  IconButton,
  useColorMode,
  Tooltip,
  HStack,
  Text,
  Box,
  Badge,
  useColorModeValue,
} from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";

export default function Navbar() {
  const { colorMode, toggleColorMode } = useColorMode();
  
  const bgGlass = useColorModeValue(
    "rgba(255, 255, 255, 0.8)",
    "rgba(26, 32, 44, 0.8)"
  );
  
  const borderColor = useColorModeValue(
    "rgba(255, 255, 255, 0.18)",
    "rgba(255, 255, 255, 0.1)"
  );

  return (
    <Box
      position="sticky"
      top={0}
      zIndex={1000}
      mb={6}
    >
      <Flex
        as="header"
        align="center"
        py={4}
        px={6}
        bg={bgGlass}
        backdropFilter="blur(20px)"
        borderBottom="1px solid"
        borderColor={borderColor}
        borderRadius="0 0 24px 24px"
        shadow="0 8px 32px rgba(0, 0, 0, 0.1)"
      >
        <HStack spacing={4}>
          <Box
            w={10}
            h={10}
            bg="linear-gradient(135deg, brand.500, accent.500)"
            borderRadius="xl"
            display="flex"
            alignItems="center"
            justifyContent="center"
            shadow="glow"
          >
            <Text color="white" fontWeight="bold" fontSize="lg">
              F
            </Text>
          </Box>
          
          <Box>
            <Heading 
              size="lg" 
              bgGradient="linear(to-r, brand.500, accent.500)"
              bgClip="text"
              fontWeight="800"
            >
              FinaMa
            </Heading>
            <Text fontSize="sm" color="gray.500" mt={-1}>
              Control Financiero Inteligente
            </Text>
          </Box>
        </HStack>
        
        <Spacer />
        
        <HStack spacing={3}>
          <Badge 
            colorScheme="brand" 
            variant="solid"
            borderRadius="full"
            px={3}
            py={1}
          >
            <Text fontSize="xs" fontWeight="bold">
              Pro
            </Text>
          </Badge>
          
          <Tooltip 
            label={colorMode === "light" ? "Modo oscuro" : "Modo claro"}
            placement="bottom"
          >
            <IconButton
              aria-label="toggle color mode"
              onClick={toggleColorMode}
              icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
              variant="ghost"
              size="lg"
              borderRadius="xl"
              _hover={{
                transform: "translateY(-1px)",
                shadow: "lg",
              }}
              transition="all 0.2s ease-in-out"
            />
          </Tooltip>
        </HStack>
      </Flex>
    </Box>
  );
}
