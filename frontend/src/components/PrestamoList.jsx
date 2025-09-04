import React, { useState } from "react";
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Badge,
  HStack,
  VStack,
  Text,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useColorModeValue,
  Icon,
  Tooltip,
  Progress,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "../config";

const MotionBox = motion(Box);

const fmt = (n) => Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const RenovarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8A5.87 5.87 0 016 12c0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/>
  </svg>
);

const PrestamoCard = ({ prestamo, onSelect, onRenovar }) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  
  const cuotasPagadas = prestamo.cuotas_pagadas ?? 0;
  const cuotasTotal = prestamo.cuotas ?? 0;
  const porcentajePagado = cuotasTotal > 0 ? (cuotasPagadas / cuotasTotal) * 100 : 0;
  const saldoPorcentaje = prestamo.monto > 0 ? (prestamo.saldo / prestamo.monto) * 100 : 0;

  const getEstadoColor = () => {
    if (porcentajePagado >= 100) return "green";
    if (porcentajePagado >= 75) return "blue";
    if (porcentajePagado >= 50) return "orange";
    return "red";
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={4}
        border="1px solid"
        borderColor={borderColor}
        shadow="md"
        _hover={{ shadow: "lg" }}
        transition="all 0.2s"
      >
        <VStack align="stretch" spacing={3}>
          <HStack justify="space-between">
            <VStack align="start" spacing={1}>
              <Text fontSize="lg" fontWeight="bold" color="brand.500">
                ${fmt(prestamo.monto)}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Monto Original
              </Text>
            </VStack>
            
            <VStack align="end" spacing={1}>
              <Text fontSize="lg" fontWeight="bold" color={saldoPorcentaje > 50 ? "red.500" : "green.500"}>
                ${fmt(prestamo.saldo)}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Saldo Pendiente
              </Text>
            </VStack>
          </HStack>

          <Box>
            <HStack justify="space-between" mb={2}>
              <Text fontSize="sm" color="gray.600">
                Progreso de Pagos
              </Text>
              <Text fontSize="sm" fontWeight="bold">
                {cuotasPagadas}/{cuotasTotal} cuotas
              </Text>
            </HStack>
            <Progress 
              value={porcentajePagado} 
              colorScheme={getEstadoColor()} 
              borderRadius="full"
              size="sm"
            />
          </Box>

          <HStack spacing={2}>
            <Badge colorScheme="purple" variant="solid" borderRadius="full" px={3}>
              {prestamo.tasa}% tasa
            </Badge>
            <Badge colorScheme="teal" variant="outline" borderRadius="full" px={3}>
              {prestamo.frecuencia}
            </Badge>
          </HStack>

          <HStack spacing={2}>
            <Button 
              size="sm" 
              colorScheme="brand" 
              variant="outline" 
              onClick={() => onSelect?.(prestamo)}
              flex={1}
            >
              Ver Detalles
            </Button>
            <Tooltip label="Solicitar renovación" placement="top">
              <Button
                size="sm"
                colorScheme="green"
                variant="ghost"
                onClick={() => onRenovar?.(prestamo)}
                leftIcon={<Icon as={RenovarIcon} />}
              >
                Renovar
              </Button>
            </Tooltip>
          </HStack>
        </VStack>
      </Box>
    </MotionBox>
  );
};

export default function PrestamoList({ prestamos, onSelect }) {
  const [selectedPrestamo, setSelectedPrestamo] = useState(null);
  const [renovacionData, setRenovacionData] = useState({
    nuevo_monto: "",
    nueva_tasa: "",
    nuevas_cuotas: ""
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const handleRenovar = (prestamo) => {
    setSelectedPrestamo(prestamo);
    // Pre-llenar con valores actuales
    setRenovacionData({
      nuevo_monto: prestamo.monto.toString(),
      nueva_tasa: prestamo.tasa.toString(),
      nuevas_cuotas: prestamo.cuotas.toString()
    });
    onOpen();
  };

  const submitRenovacion = async () => {
    try {
      const payload = {};
      
      // Solo enviar valores que han cambiado
      if (renovacionData.nuevo_monto !== selectedPrestamo.monto.toString()) {
        payload.nuevo_monto = Number(renovacionData.nuevo_monto);
      }
      if (renovacionData.nueva_tasa !== selectedPrestamo.tasa.toString()) {
        payload.nueva_tasa = Number(renovacionData.nueva_tasa);
      }
      if (renovacionData.nuevas_cuotas !== selectedPrestamo.cuotas.toString()) {
        payload.nuevas_cuotas = Number(renovacionData.nuevas_cuotas);
      }

      await axios.post(`${API}/prestamos/${selectedPrestamo.id}/renovar`, payload);

      toast({
        title: "¡Solicitud de renovación enviada!",
        description: "La solicitud está pendiente de aprobación",
        status: "success",
        duration: 4000,
      });

      onClose();
    } catch (error) {
      console.error("Error renovando préstamo:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "No se pudo enviar la solicitud de renovación",
        status: "error",
        duration: 4000,
      });
    }
  };

  return (
    <>
      <Card shadow="xl" borderRadius="2xl" bg="transparent" border="none">
        <CardHeader>
          <HStack justify="space-between">
            <Heading size="lg" bgGradient="linear(to-r, brand.500, accent.500)" bgClip="text">
              Préstamos Activos
            </Heading>
            <Badge colorScheme="brand" variant="solid" px={3} py={1} borderRadius="full">
              {prestamos?.length || 0} préstamos
            </Badge>
          </HStack>
        </CardHeader>
        
        <CardBody>
          {prestamos?.length ? (
            <VStack spacing={4}>
              {prestamos.map((prestamo, index) => (
                <PrestamoCard
                  key={prestamo.id}
                  prestamo={prestamo}
                  onSelect={onSelect}
                  onRenovar={handleRenovar}
                />
              ))}
            </VStack>
          ) : (
            <Box textAlign="center" py={12}>
              <Text color="gray.500" fontSize="lg">
                No hay préstamos activos
              </Text>
              <Text color="gray.400" fontSize="sm" mt={2}>
                Los préstamos aparecerán aquí una vez creados
              </Text>
            </Box>
          )}
        </CardBody>
      </Card>

      {/* Modal de Renovación */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent borderRadius="2xl">
          <ModalHeader>
            <VStack align="start" spacing={1}>
              <Text>Solicitar Renovación</Text>
              <Text fontSize="sm" color="gray.500" fontWeight="normal">
                Préstamo actual: ${fmt(selectedPrestamo?.monto || 0)} - {selectedPrestamo?.cuotas} cuotas
              </Text>
            </VStack>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody pb={6}>
            <VStack spacing={6}>
              <Box w="full" p={4} bg="blue.50" borderRadius="xl" border="1px solid" borderColor="blue.200">
                <Text fontSize="sm" fontWeight="bold" color="blue.700" mb={2}>
                  Condiciones Actuales
                </Text>
                <HStack spacing={6}>
                  <Box>
                    <Text fontSize="xs" color="blue.600">Monto</Text>
                    <Text fontWeight="bold">${fmt(selectedPrestamo?.monto || 0)}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="blue.600">Tasa</Text>
                    <Text fontWeight="bold">{selectedPrestamo?.tasa}%</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="blue.600">Cuotas</Text>
                    <Text fontWeight="bold">{selectedPrestamo?.cuotas}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="blue.600">Saldo</Text>
                    <Text fontWeight="bold" color="red.600">${fmt(selectedPrestamo?.saldo || 0)}</Text>
                  </Box>
                </HStack>
              </Box>

              <Text fontSize="lg" fontWeight="bold" color="brand.500" w="full">
                Nuevas Condiciones Propuestas
              </Text>

              <HStack spacing={4} w="full">
                <FormControl>
                  <FormLabel>Nuevo Monto</FormLabel>
                  <NumberInput min={0}>
                    <NumberInputField
                      value={renovacionData.nuevo_monto}
                      onChange={(e) => setRenovacionData(prev => ({ ...prev, nuevo_monto: e.target.value }))}
                    />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Nueva Tasa (%)</FormLabel>
                  <NumberInput min={0} max={100} step={0.1}>
                    <NumberInputField
                      value={renovacionData.nueva_tasa}
                      onChange={(e) => setRenovacionData(prev => ({ ...prev, nueva_tasa: e.target.value }))}
                    />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Nuevas Cuotas</FormLabel>
                  <NumberInput min={1}>
                    <NumberInputField
                      value={renovacionData.nuevas_cuotas}
                      onChange={(e) => setRenovacionData(prev => ({ ...prev, nuevas_cuotas: e.target.value }))}
                    />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </HStack>

              <Box w="full" p={4} bg="green.50" borderRadius="xl" border="1px solid" borderColor="green.200">
                <Text fontSize="sm" color="green.700">
                  <Icon viewBox="0 0 24 24" w={4} h={4} color="green.500" display="inline" mr={2}>
                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </Icon>
                  Se enviará una solicitud de renovación que requiere aprobación antes de aplicarse.
                </Text>
              </Box>

              <HStack spacing={3} w="full">
                <Button
                  colorScheme="green"
                  flex={1}
                  onClick={submitRenovacion}
                >
                  Enviar Solicitud
                </Button>
                <Button variant="outline" flex={1} onClick={onClose}>
                  Cancelar
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
