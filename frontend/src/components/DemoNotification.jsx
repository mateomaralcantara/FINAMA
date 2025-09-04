import React, { useState, useEffect } from "react";
import {
  Box,
  Text,
  HStack,
  Button,
  useColorModeValue,
  Collapse,
  Icon,
  VStack,
  Link,
  Badge,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "../config";

const MotionBox = motion(Box);

const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function DemoNotification() {
  const [isDemo, setIsDemo] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  const bgColor = useColorModeValue("orange.50", "orange.900");
  const borderColor = useColorModeValue("orange.200", "orange.700");
  const textColor = useColorModeValue("orange.800", "orange.200");

  useEffect(() => {
    const checkDemoMode = async () => {
      try {
        // Verificar si está en modo demo consultando el dashboard
        const response = await axios.get(`${API}/dashboard`);
        if (response.data.demo) {
          setIsDemo(true);
          setIsVisible(true);
        }

        // Verificar conexión específica
        const testConnection = await axios.get(`${API}/test-connection`);
        setConnectionStatus(testConnection.data);
      } catch (error) {
        console.error("Error checking demo mode:", error);
        setIsDemo(true);
        setIsVisible(true);
      }
    };

    checkDemoMode();
  }, []);

  if (!isDemo || !isVisible) return null;

  return (
    <MotionBox
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.5 }}
    >
      <Collapse in={isVisible}>
        <Box
          bg={bgColor}
          border="2px solid"
          borderColor={borderColor}
          borderRadius="xl"
          p={4}
          mb={6}
          position="relative"
          overflow="hidden"
        >
          {/* Background pattern */}
          <Box
            position="absolute"
            top={0}
            right={0}
            w="100px"
            h="100px"
            bg="orange.200"
            borderRadius="full"
            opacity={0.1}
            transform="translate(30px, -30px)"
          />

          <HStack justify="space-between" align="start">
            <HStack spacing={3} flex={1}>
              <Box
                p={2}
                bg="orange.500"
                borderRadius="lg"
                color="white"
              >
                <Icon as={InfoIcon} />
              </Box>
              
              <VStack align="start" spacing={2} flex={1}>
                <HStack spacing={2}>
                  <Text fontWeight="bold" color={textColor} fontSize="lg">
                    Modo Demostración Activo
                  </Text>
                  <Badge colorScheme="orange" variant="solid" borderRadius="full">
                    DEMO
                  </Badge>
                </HStack>
                
                <Text color={textColor} fontSize="sm">
                  Estás viendo datos de demostración porque las tablas de Supabase no están configuradas.
                </Text>
                
                <Box>
                  <Text color={textColor} fontSize="sm" fontWeight="semibold" mb={1}>
                    Para activar datos reales:
                  </Text>
                  <Text color={textColor} fontSize="sm">
                    1. Ve a{" "}
                    <Link 
                      href="https://mlplyzjzapnwrxfhxvpn.supabase.co" 
                      target="_blank"
                      color="orange.600"
                      fontWeight="bold"
                      textDecoration="underline"
                    >
                      tu panel de Supabase
                    </Link>
                  </Text>
                  <Text color={textColor} fontSize="sm">
                    2. SQL Editor → Ejecutar el archivo: <code>/app/database/complete_schema.sql</code>
                  </Text>
                  <Text color={textColor} fontSize="sm">
                    3. Recargar la página
                  </Text>
                </Box>

                {connectionStatus && !connectionStatus.connected && (
                  <Box 
                    p={2} 
                    bg="red.50" 
                    borderRadius="md" 
                    border="1px solid" 
                    borderColor="red.200"
                  >
                    <Text fontSize="xs" color="red.700" fontWeight="semibold">
                      Error de conexión: {connectionStatus.error}
                    </Text>
                    <Text fontSize="xs" color="red.600">
                      {connectionStatus.suggestion}
                    </Text>
                  </Box>
                )}
              </VStack>
            </HStack>

            <Button
              size="sm"
              variant="ghost"
              colorScheme="orange"
              onClick={() => setIsVisible(false)}
              leftIcon={<Icon as={CloseIcon} />}
            >
              Ocultar
            </Button>
          </HStack>
        </Box>
      </Collapse>
    </MotionBox>
  );
}