// frontend/src/pages/Home.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  SimpleGrid,
  Heading,
  useToast,
  Stack,
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  VStack,
  HStack,
  Button,
  useColorModeValue,
  Text,
  Badge,
  Divider,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "../config";
import ClienteList from "../components/ClienteList";
import ClienteForm from "../components/ClienteForm";
import PrestamoList from "../components/PrestamoList";
import PrestamoForm from "../components/PrestamoForm";
import MensajeAlerta from "../components/MensajeAlerta";
import CalculadoraPrestamo from "../components/CalculadoraPrestamo";
import Dashboard from "../components/Dashboard";
import SolicitudesManager from "../components/SolicitudesManager";
import SolicitudForm from "../components/SolicitudForm";

const MotionBox = motion(Box);

const TabIcon = ({ children }) => (
  <HStack spacing={2} align="center">
    {children}
  </HStack>
);

const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
  </svg>
);

const ClientIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
  </svg>
);

const RequestIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
  </svg>
);

const ManageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const CalculatorIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8-4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8-4H7V7h2v2zm4 0h-2V7h2v2zm4 0h-2V7h2v2z"/>
  </svg>
);

export default function Home() {
  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [prestamos, setPrestamos] = useState([]);
  const [selectedPrestamo, setSelectedPrestamo] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const toast = useToast();

  const tabBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");

  const fetchClientes = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/clientes`);
      // backend responde { count, items }
      setClientes(res.data?.items ?? []);
    } catch (e) {
      console.error(e);
      toast({ status: "error", title: "No se pudo cargar clientes" });
    }
  }, [toast]);

  const fetchPrestamos = useCallback(
    async (clienteId) => {
      if (!clienteId) return;
      try {
        const res = await axios.get(`${API}/prestamos?cliente_id=${clienteId}`);
        // backend responde { count, items }
        setPrestamos(res.data?.items ?? []);
      } catch (e) {
        console.error(e);
        toast({ status: "error", title: "No se pudo cargar préstamos" });
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const handleSelectCliente = (cliente) => {
    setSelectedCliente(cliente);
    setSelectedPrestamo(null);
    fetchPrestamos(cliente?.id);
  };

  const handleSelectPrestamo = (p) => {
    setSelectedPrestamo(p);
    const nombre = selectedCliente?.nombre ?? "cliente";
    const saldo = Number(p?.saldo ?? 0).toFixed(2);
    const cuotasPagadas = Number(p?.cuotas_pagadas ?? 0);
    const cuotasTotales = Number(p?.cuotas ?? 0);
    const restantes = p?.cuotas_restantes ?? Math.max(cuotasTotales - cuotasPagadas, 0);
    setMensaje(`Hola ${nombre}, tu saldo pendiente es $${saldo}. Te quedan ${restantes} cuotas.`);
  };

  const tabData = [
    {
      label: "Dashboard",
      icon: <DashboardIcon />,
      component: <Dashboard />
    },
    {
      label: "Gestión de Clientes",
      icon: <ClientIcon />,
      component: (
        <VStack spacing={8} align="stretch">
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
              <Box>
                <ClienteForm onSuccess={fetchClientes} />
              </Box>
              <Box gridColumn={{ base: "span 1", lg: "span 2" }}>
                <ClienteList clientes={clientes} onSelect={handleSelectCliente} />
              </Box>
            </SimpleGrid>
          </MotionBox>

          {selectedCliente && (
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <VStack spacing={6} align="stretch">
                <Divider />
                
                <HStack spacing={4} align="center">
                  <Text fontSize="xl" fontWeight="bold" color="brand.500">
                    Préstamos de {selectedCliente.nombre}
                  </Text>
                  <Badge colorScheme="brand" variant="solid" px={3} py={1} borderRadius="full">
                    Cliente Seleccionado
                  </Badge>
                </HStack>

                <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
                  <Box>
                    <PrestamoForm
                      cliente={selectedCliente}
                      onSuccess={() => fetchPrestamos(selectedCliente.id)}
                    />
                  </Box>
                  <Box gridColumn={{ base: "span 1", lg: "span 2" }}>
                    <PrestamoList prestamos={prestamos} onSelect={handleSelectPrestamo} />
                  </Box>
                </SimpleGrid>
              </VStack>
            </MotionBox>
          )}

          <MensajeAlerta mensaje={mensaje} />
        </VStack>
      )
    },
    {
      label: "Nueva Solicitud",
      icon: <RequestIcon />,
      component: (
        <VStack spacing={8} align="stretch">
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <SolicitudForm clientes={clientes} onSuccess={() => {
              // Refresh dashboard y otros datos si es necesario
              toast({
                title: "¡Solicitud enviada exitosamente!",
                description: "La solicitud está siendo procesada",
                status: "success",
                duration: 4000,
              });
            }} />
          </MotionBox>
        </VStack>
      )
    },
    {
      label: "Gestión de Solicitudes",
      icon: <ManageIcon />,
      component: (
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <SolicitudesManager />
        </MotionBox>
      )
    },
    {
      label: "Calculadora",
      icon: <CalculatorIcon />,
      component: (
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box maxW="4xl" mx="auto">
            <CalculadoraPrestamo />
          </Box>
        </MotionBox>
      )
    }
  ];

  return (
    <Stack spacing={0} pb={16} minH="100vh">
      <Box
        bg={tabBg}
        borderRadius="2xl"
        border="1px solid"
        borderColor={borderColor}
        shadow="xl"
        overflow="hidden"
      >
        <Tabs 
          variant="enclosed" 
          colorScheme="brand"
          index={activeTab}
          onChange={setActiveTab}
        >
          <TabList 
            bg="transparent" 
            borderBottom="1px solid" 
            borderColor={borderColor}
            overflowX="auto"
            css={{
              '&::-webkit-scrollbar': {
                height: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,0.1)',
                borderRadius: '4px',
              }
            }}
          >
            {tabData.map((tab, index) => (
              <Tab
                key={index}
                _selected={{
                  color: "brand.500",
                  borderColor: "brand.500",
                  bg: "brand.50",
                  _dark: {
                    bg: "brand.900",
                    color: "brand.200"
                  }
                }}
                _hover={{
                  bg: "gray.50",
                  _dark: {
                    bg: "gray.700"
                  }
                }}
                transition="all 0.2s"
                fontWeight="600"
                minW="fit-content"
              >
                <TabIcon>
                  {tab.icon}
                  <Text>{tab.label}</Text>
                </TabIcon>
              </Tab>
            ))}
          </TabList>

          <TabPanels>
            {tabData.map((tab, index) => (
              <TabPanel key={index} p={8}>
                {tab.component}
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </Box>
    </Stack>
  );
}
