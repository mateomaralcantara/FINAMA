import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Select,
  Textarea,
  FormControl,
  FormLabel,
  FormErrorMessage,
  useToast,
  Divider,
  Badge,
  useColorModeValue,
  Grid,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  RadioGroup,
  Radio,
  Stack,
  Icon,
  Collapse,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "../config";

const MotionBox = motion(Box);

export default function SolicitudForm({ clientes = [], onSuccess }) {
  const [formData, setFormData] = useState({
    tipo_solicitud: "nuevo_cliente",
    cliente_id: "",
    prestamo_original_id: "",
    monto: "",
    tasa: "",
    cuotas: "",
    frecuencia: "mensual",
    // Datos para nuevo cliente
    nombre_solicitante: "",
    email_solicitante: "", 
    telefono_solicitante: "",
    ingresos_mensuales: "",
    referencias: "",
    motivo_solicitud: ""
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [prestamosCliente, setPrestamosCliente] = useState([]);
  const toast = useToast();

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");

  useEffect(() => {
    if (formData.cliente_id && formData.tipo_solicitud === "renovacion") {
      fetchPrestamosCliente(formData.cliente_id);
    }
  }, [formData.cliente_id, formData.tipo_solicitud]);

  const fetchPrestamosCliente = async (clienteId) => {
    try {
      const response = await axios.get(`${API}/prestamos?cliente_id=${clienteId}`);
      setPrestamosCliente(response.data.items || []);
    } catch (error) {
      console.error("Error fetching prestamos:", error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validaciones básicas
    if (!formData.monto || Number(formData.monto) <= 0) {
      newErrors.monto = "El monto es requerido y debe ser mayor a 0";
    }
    if (!formData.tasa || Number(formData.tasa) <= 0) {
      newErrors.tasa = "La tasa es requerida y debe ser mayor a 0";
    }
    if (!formData.cuotas || Number(formData.cuotas) <= 0) {
      newErrors.cuotas = "Las cuotas son requeridas y deben ser mayor a 0";
    }

    // Validaciones según el tipo
    if (formData.tipo_solicitud === "nuevo_cliente") {
      if (!formData.nombre_solicitante.trim()) {
        newErrors.nombre_solicitante = "El nombre es requerido";
      }
      if (!formData.email_solicitante.trim()) {
        newErrors.email_solicitante = "El email es requerido";
      }
    } else if (["prestamo_adicional", "renovacion"].includes(formData.tipo_solicitud)) {
      if (!formData.cliente_id) {
        newErrors.cliente_id = "Debe seleccionar un cliente";
      }
    }

    if (formData.tipo_solicitud === "renovacion" && !formData.prestamo_original_id) {
      newErrors.prestamo_original_id = "Debe seleccionar el préstamo a renovar";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await axios.post(`${API}/solicitudes`, {
        ...formData,
        monto: Number(formData.monto),
        tasa: Number(formData.tasa),
        cuotas: Number(formData.cuotas),
        ingresos_mensuales: formData.ingresos_mensuales ? Number(formData.ingresos_mensuales) : null,
        cliente_id: formData.cliente_id || null,
        prestamo_original_id: formData.prestamo_original_id || null
      });

      toast({
        title: "¡Solicitud enviada!",
        description: "La solicitud ha sido enviada y está pendiente de revisión",
        status: "success",
        duration: 4000,
      });

      // Reset form
      setFormData({
        tipo_solicitud: "nuevo_cliente",
        cliente_id: "",
        prestamo_original_id: "",
        monto: "",
        tasa: "",
        cuotas: "",
        frecuencia: "mensual",
        nombre_solicitante: "",
        email_solicitante: "",
        telefono_solicitante: "",
        ingresos_mensuales: "",
        referencias: "",
        motivo_solicitud: ""
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error creating solicitud:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "No se pudo enviar la solicitud",
        status: "error",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const getTipoLabel = (tipo) => {
    switch (tipo) {
      case "nuevo_cliente": return "Nuevo Cliente";
      case "prestamo_adicional": return "Préstamo Adicional";
      case "renovacion": return "Renovación";
      default: return tipo;
    }
  };

  const renderPrestamoInfo = () => {
    const prestamo = prestamosCliente.find(p => p.id === Number(formData.prestamo_original_id));
    if (!prestamo) return null;

    return (
      <Box p={4} bg="blue.50" borderRadius="xl" border="1px solid" borderColor="blue.200">
        <Text fontSize="sm" fontWeight="bold" color="blue.700" mb={2}>
          Información del Préstamo Original
        </Text>
        <Grid templateColumns="repeat(3, 1fr)" gap={3}>
          <Box>
            <Text fontSize="xs" color="blue.600">Monto Original</Text>
            <Text fontSize="sm" fontWeight="bold">${Number(prestamo.monto).toLocaleString()}</Text>
          </Box>
          <Box>
            <Text fontSize="xs" color="blue.600">Saldo Actual</Text>
            <Text fontSize="sm" fontWeight="bold">${Number(prestamo.saldo).toLocaleString()}</Text>
          </Box>
          <Box>
            <Text fontSize="xs" color="blue.600">Tasa Actual</Text>
            <Text fontSize="sm" fontWeight="bold">{prestamo.tasa}%</Text>
          </Box>
        </Grid>
      </Box>
    );
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        bg={cardBg}
        borderRadius="2xl"
        p={8}
        border="1px solid"
        borderColor={borderColor}
        shadow="xl"
      >
        <VStack align="stretch" spacing={6}>
          <HStack justify="space-between" align="center">
            <Text fontSize="2xl" fontWeight="bold" bgGradient="linear(to-r, brand.500, accent.500)" bgClip="text">
              Nueva Solicitud de Préstamo
            </Text>
            <Badge colorScheme="brand" variant="solid" px={3} py={1} borderRadius="full">
              Sistema de Solicitudes
            </Badge>
          </HStack>

          <Divider />

          {/* Tipo de Solicitud */}
          <FormControl>
            <FormLabel fontWeight="bold">Tipo de Solicitud</FormLabel>
            <RadioGroup 
              value={formData.tipo_solicitud} 
              onChange={(value) => handleInputChange("tipo_solicitud", value)}
            >
              <Stack spacing={4}>
                <Radio value="nuevo_cliente" colorScheme="brand">
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="600">Nuevo Cliente</Text>
                    <Text fontSize="sm" color="gray.500">
                      Para personas que no tienen cuenta aún
                    </Text>
                  </VStack>
                </Radio>
                <Radio value="prestamo_adicional" colorScheme="brand">
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="600">Préstamo Adicional</Text>
                    <Text fontSize="sm" color="gray.500">
                      Para clientes existentes que desean un préstamo adicional
                    </Text>
                  </VStack>
                </Radio>
                <Radio value="renovacion" colorScheme="brand">
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="600">Renovación</Text>
                    <Text fontSize="sm" color="gray.500">
                      Renovar un préstamo existente con nuevas condiciones
                    </Text>
                  </VStack>
                </Radio>
              </Stack>
            </RadioGroup>
          </FormControl>

          <Divider />

          {/* Datos del Cliente/Solicitante */}
          <Collapse in={formData.tipo_solicitud === "nuevo_cliente"}>
            <VStack align="stretch" spacing={4}>
              <Text fontSize="lg" fontWeight="bold" color="brand.500">
                Datos del Solicitante
              </Text>
              
              <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={4}>
                <FormControl isInvalid={errors.nombre_solicitante}>
                  <FormLabel>Nombre Completo *</FormLabel>
                  <Input
                    value={formData.nombre_solicitante}
                    onChange={(e) => handleInputChange("nombre_solicitante", e.target.value)}
                    placeholder="Nombre completo del solicitante"
                  />
                  <FormErrorMessage>{errors.nombre_solicitante}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={errors.email_solicitante}>
                  <FormLabel>Email *</FormLabel>
                  <Input
                    type="email"
                    value={formData.email_solicitante}
                    onChange={(e) => handleInputChange("email_solicitante", e.target.value)}
                    placeholder="correo@ejemplo.com"
                  />
                  <FormErrorMessage>{errors.email_solicitante}</FormErrorMessage>
                </FormControl>

                <FormControl>
                  <FormLabel>Teléfono</FormLabel>
                  <Input
                    value={formData.telefono_solicitante}
                    onChange={(e) => handleInputChange("telefono_solicitante", e.target.value)}
                    placeholder="Número de teléfono"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Ingresos Mensuales</FormLabel>
                  <NumberInput min={0}>
                    <NumberInputField
                      value={formData.ingresos_mensuales}
                      onChange={(e) => handleInputChange("ingresos_mensuales", e.target.value)}
                      placeholder="0"
                    />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </Grid>
            </VStack>
          </Collapse>

          {/* Selección de Cliente Existente */}
          <Collapse in={["prestamo_adicional", "renovacion"].includes(formData.tipo_solicitud)}>
            <FormControl isInvalid={errors.cliente_id}>
              <FormLabel fontWeight="bold">Seleccionar Cliente</FormLabel>
              <Select
                value={formData.cliente_id}
                onChange={(e) => handleInputChange("cliente_id", e.target.value)}
                placeholder="Seleccionar cliente existente..."
              >
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre} - {cliente.email}
                  </option>
                ))}
              </Select>
              <FormErrorMessage>{errors.cliente_id}</FormErrorMessage>
            </FormControl>
          </Collapse>

          {/* Selección de Préstamo a Renovar */}
          <Collapse in={formData.tipo_solicitud === "renovacion" && prestamosCliente.length > 0}>
            <VStack align="stretch" spacing={4}>
              <FormControl isInvalid={errors.prestamo_original_id}>
                <FormLabel fontWeight="bold">Préstamo a Renovar</FormLabel>
                <Select
                  value={formData.prestamo_original_id}
                  onChange={(e) => handleInputChange("prestamo_original_id", e.target.value)}
                  placeholder="Seleccionar préstamo a renovar..."
                >
                  {prestamosCliente.map((prestamo) => (
                    <option key={prestamo.id} value={prestamo.id}>
                      ${Number(prestamo.monto).toLocaleString()} - Saldo: ${Number(prestamo.saldo).toLocaleString()}
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{errors.prestamo_original_id}</FormErrorMessage>
              </FormControl>

              {renderPrestamoInfo()}
            </VStack>
          </Collapse>

          <Divider />

          {/* Datos del Préstamo */}
          <VStack align="stretch" spacing={4}>
            <Text fontSize="lg" fontWeight="bold" color="brand.500">
              Datos del Préstamo Solicitado
            </Text>

            <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
              <FormControl isInvalid={errors.monto}>
                <FormLabel>Monto Solicitado *</FormLabel>
                <NumberInput min={0}>
                  <NumberInputField
                    value={formData.monto}
                    onChange={(e) => handleInputChange("monto", e.target.value)}
                    placeholder="0"
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormErrorMessage>{errors.monto}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={errors.tasa}>
                <FormLabel>Tasa de Interés (%) *</FormLabel>
                <NumberInput min={0} max={100} step={0.1}>
                  <NumberInputField
                    value={formData.tasa}
                    onChange={(e) => handleInputChange("tasa", e.target.value)}
                    placeholder="0.0"
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormErrorMessage>{errors.tasa}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={errors.cuotas}>
                <FormLabel>Número de Cuotas *</FormLabel>
                <NumberInput min={1}>
                  <NumberInputField
                    value={formData.cuotas}
                    onChange={(e) => handleInputChange("cuotas", e.target.value)}
                    placeholder="0"
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormErrorMessage>{errors.cuotas}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel>Frecuencia de Pago</FormLabel>
                <Select
                  value={formData.frecuencia}
                  onChange={(e) => handleInputChange("frecuencia", e.target.value)}
                >
                  <option value="diario">Diario</option>
                  <option value="semanal">Semanal</option>
                  <option value="quincenal">Quincenal</option>
                  <option value="mensual">Mensual</option>
                </Select>
              </FormControl>
            </Grid>
          </VStack>

          {/* Información Adicional */}
          <VStack align="stretch" spacing={4}>
            <Text fontSize="lg" fontWeight="bold" color="brand.500">
              Información Adicional
            </Text>

            <FormControl>
              <FormLabel>Referencias</FormLabel>
              <Textarea
                value={formData.referencias}
                onChange={(e) => handleInputChange("referencias", e.target.value)}
                placeholder="Referencias personales o comerciales..."
                rows={3}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Motivo de la Solicitud</FormLabel>
              <Textarea
                value={formData.motivo_solicitud}
                onChange={(e) => handleInputChange("motivo_solicitud", e.target.value)}
                placeholder="Describa el motivo por el cual solicita el préstamo..."
                rows={3}
              />
            </FormControl>
          </VStack>

          <Divider />

          <Button
            colorScheme="brand"
            size="lg"
            onClick={handleSubmit}
            isLoading={loading}
            loadingText="Enviando solicitud..."
            leftIcon={
              <Icon viewBox="0 0 24 24" w={5} h={5}>
                <path
                  fill="currentColor"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                />
              </Icon>
            }
          >
            Enviar Solicitud
          </Button>
        </VStack>
      </Box>
    </MotionBox>
  );
}