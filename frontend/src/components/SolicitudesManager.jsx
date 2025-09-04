import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  Divider,
  Avatar,
  useColorModeValue,
  Textarea,
  Select,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "../config";

const MotionBox = motion(Box);

const SolicitudCard = ({ solicitud, onAction }) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  
  const getEstadoColor = (estado) => {
    switch (estado) {
      case "pendiente": return "orange";
      case "en_revision": return "blue";
      case "aprobada": return "green";
      case "rechazada": return "red";
      default: return "gray";
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

  const formatMoney = (amount) => `$${Number(amount).toLocaleString()}`;
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  return (
    <MotionBox
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Box
        bg={cardBg}
        borderRadius="2xl"
        p={6}
        border="1px solid"
        borderColor={borderColor}
        shadow="lg"
        _hover={{ shadow: "xl" }}
        transition="all 0.2s"
      >
        <VStack align="stretch" spacing={4}>
          <HStack justify="space-between">
            <HStack spacing={3}>
              <Avatar 
                size="sm" 
                name={solicitud.nombre_solicitante || solicitud.clientes?.nombre}
                bg="brand.500"
              />
              <Box>
                <Text fontWeight="bold" fontSize="lg">
                  {solicitud.nombre_solicitante || solicitud.clientes?.nombre}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {solicitud.email_solicitante || solicitud.clientes?.email}
                </Text>
              </Box>
            </HStack>
            
            <VStack spacing={2} align="end">
              <Badge 
                colorScheme={getEstadoColor(solicitud.estado)} 
                variant="solid"
                borderRadius="full"
                px={3}
                py={1}
              >
                {solicitud.estado.toUpperCase()}
              </Badge>
              <Badge variant="outline" borderRadius="full" px={2}>
                {getTipoLabel(solicitud.tipo_solicitud)}
              </Badge>
            </VStack>
          </HStack>

          <Divider />

          <Grid templateColumns="repeat(2, 1fr)" gap={4}>
            <Box>
              <Text fontSize="sm" color="gray.500" fontWeight="600">
                Monto Solicitado
              </Text>
              <Text fontSize="xl" fontWeight="bold" color="brand.500">
                {formatMoney(solicitud.monto)}
              </Text>
            </Box>
            
            <Box>
              <Text fontSize="sm" color="gray.500" fontWeight="600">
                Cuotas
              </Text>
              <Text fontSize="xl" fontWeight="bold">
                {solicitud.cuotas} {solicitud.frecuencia}s
              </Text>
            </Box>

            <Box>
              <Text fontSize="sm" color="gray.500" fontWeight="600">
                Tasa
              </Text>
              <Text fontSize="lg" fontWeight="bold">
                {solicitud.tasa}%
              </Text>
            </Box>

            <Box>
              <Text fontSize="sm" color="gray.500" fontWeight="600">
                Fecha Solicitud
              </Text>
              <Text fontSize="sm">
                {formatDate(solicitud.fecha_solicitud)}
              </Text>
            </Box>
          </Grid>

          {solicitud.motivo_solicitud && (
            <>
              <Divider />
              <Box>
                <Text fontSize="sm" color="gray.500" fontWeight="600" mb={2}>
                  Motivo
                </Text>
                <Text fontSize="sm">
                  {solicitud.motivo_solicitud}
                </Text>
              </Box>
            </>
          )}

          {solicitud.ingresos_mensuales && (
            <Box>
              <Text fontSize="sm" color="gray.500" fontWeight="600">
                Ingresos Mensuales
              </Text>
              <Text fontSize="lg" fontWeight="bold" color="green.500">
                {formatMoney(solicitud.ingresos_mensuales)}
              </Text>
            </Box>
          )}

          {solicitud.estado === "pendiente" && (
            <HStack spacing={3} pt={2}>
              <Button
                colorScheme="green"
                size="sm"
                flex={1}
                onClick={() => onAction(solicitud.id, "aprobada")}
              >
                Aprobar
              </Button>
              <Button
                colorScheme="blue"
                variant="outline"
                size="sm"
                flex={1}
                onClick={() => onAction(solicitud.id, "en_revision")}
              >
                En Revisión
              </Button>
              <Button
                colorScheme="red"
                variant="outline"
                size="sm"
                flex={1}
                onClick={() => onAction(solicitud.id, "rechazada")}
              >
                Rechazar
              </Button>
            </HStack>
          )}
        </VStack>
      </Box>
    </MotionBox>
  );
};

export default function SolicitudesManager() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEstado, setSelectedEstado] = useState("todas");
  const [comentarios, setComentarios] = useState("");
  const toast = useToast();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [solicitudActual, setSolicitudActual] = useState(null);
  const [accionActual, setAccionActual] = useState("");

  const fetchSolicitudes = useCallback(async () => {
    try {
      const params = selectedEstado !== "todas" ? { estado: selectedEstado } : {};
      const response = await axios.get(`${API}/solicitudes`, { params });
      setSolicitudes(response.data.items || []);
    } catch (error) {
      console.error("Error fetching solicitudes:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las solicitudes",
        status: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [selectedEstado, toast]);

  useEffect(() => {
    fetchSolicitudes();
  }, [fetchSolicitudes]);

  const handleAction = async (solicitudId, accion) => {
    setSolicitudActual(solicitudId);
    setAccionActual(accion);
    
    if (accion === "aprobada") {
      onOpen(); // Abrir modal para confirmación
    } else {
      await processAction(solicitudId, accion);
    }
  };

  const processAction = async (solicitudId, accion) => {
    try {
      await axios.patch(`${API}/solicitudes/${solicitudId}`, {
        estado: accion,
        comentarios: comentarios || null
      });

      toast({
        title: "Éxito",
        description: `Solicitud ${accion} correctamente`,
        status: "success",
        duration: 3000,
      });

      setComentarios("");
      onClose();
      fetchSolicitudes();
    } catch (error) {
      console.error("Error processing action:", error);
      toast({
        title: "Error",
        description: "No se pudo procesar la acción",
        status: "error",
        duration: 3000,
      });
    }
  };

  const filteredSolicitudes = solicitudes.filter(s => 
    selectedEstado === "todas" || s.estado === selectedEstado
  );

  const estadoCounts = {
    todas: solicitudes.length,
    pendiente: solicitudes.filter(s => s.estado === "pendiente").length,
    en_revision: solicitudes.filter(s => s.estado === "en_revision").length,
    aprobada: solicitudes.filter(s => s.estado === "aprobada").length,
    rechazada: solicitudes.filter(s => s.estado === "rechazada").length,
  };

  if (loading) {
    return (
      <Box>
        <Text fontSize="xl" fontWeight="bold" mb={6}>
          Gestión de Solicitudes
        </Text>
        <Grid templateColumns="repeat(auto-fit, minmax(400px, 1fr))" gap={6}>
          {[...Array(3)].map((_, i) => (
            <Box key={i} h="200px" bg="gray.200" borderRadius="2xl" />
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <VStack align="stretch" spacing={6}>
        <HStack justify="space-between">
          <Text fontSize="2xl" fontWeight="bold">
            Gestión de Solicitudes
          </Text>
          <Badge colorScheme="brand" variant="solid" px={3} py={1} borderRadius="full">
            {solicitudes.length} total
          </Badge>
        </HStack>

        <Tabs variant="enclosed" onChange={(index) => {
          const estados = ["todas", "pendiente", "en_revision", "aprobada", "rechazada"];
          setSelectedEstado(estados[index]);
        }}>
          <TabList>
            <Tab>Todas ({estadoCounts.todas})</Tab>
            <Tab>Pendientes ({estadoCounts.pendiente})</Tab>
            <Tab>En Revisión ({estadoCounts.en_revision})</Tab>
            <Tab>Aprobadas ({estadoCounts.aprobada})</Tab>
            <Tab>Rechazadas ({estadoCounts.rechazada})</Tab>
          </TabList>

          <TabPanels>
            {["todas", "pendiente", "en_revision", "aprobada", "rechazada"].map((estado) => (
              <TabPanel key={estado} px={0}>
                <Grid templateColumns="repeat(auto-fit, minmax(400px, 1fr))" gap={6}>
                  {filteredSolicitudes.map((solicitud) => (
                    <SolicitudCard
                      key={solicitud.id}
                      solicitud={solicitud}
                      onAction={handleAction}
                    />
                  ))}
                </Grid>
                
                {filteredSolicitudes.length === 0 && (
                  <Box textAlign="center" py={12}>
                    <Text color="gray.500" fontSize="lg">
                      No hay solicitudes {estado !== "todas" ? `${estado}s` : ""}
                    </Text>
                  </Box>
                )}
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Modal de confirmación */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent borderRadius="2xl">
          <ModalHeader>Confirmar Aprobación</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Text>
                ¿Estás seguro de aprobar esta solicitud? Se creará automáticamente 
                el cliente y/o préstamo según corresponda.
              </Text>
              
              <Box w="full">
                <Text fontSize="sm" color="gray.500" mb={2}>
                  Comentarios (opcional)
                </Text>
                <Textarea
                  value={comentarios}
                  onChange={(e) => setComentarios(e.target.value)}
                  placeholder="Agregar comentarios sobre la aprobación..."
                  rows={3}
                />
              </Box>

              <HStack spacing={3} w="full">
                <Button
                  colorScheme="green"
                  flex={1}
                  onClick={() => processAction(solicitudActual, accionActual)}
                >
                  Confirmar Aprobación
                </Button>
                <Button variant="outline" flex={1} onClick={onClose}>
                  Cancelar
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}