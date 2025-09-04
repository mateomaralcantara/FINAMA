import React, { useState, useEffect } from "react";
import {
  Grid,
  GridItem,  
  Box,
  Text,
  useColorModeValue,
  Icon,
  VStack,
  HStack,
  Progress,
  Badge,
  Divider,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "../config";

// Iconos personalizados (puedes usar react-icons si lo instalas)
const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
  </svg>
);

const CreditCardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 3v2h16V7H4zm0 4v6h16v-6H4z"/>
  </svg>
);

const TrendingUpIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

const ClockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
);

// Iconos para tendencias
const ArrowUpIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <polyline points="18,15 12,9 6,15"></polyline>
  </svg>
);

const ArrowDownIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <polyline points="6,9 12,15 18,9"></polyline>
  </svg>
);

const MotionBox = motion(Box);

const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  gradient, 
  iconColor,
  trend = null,
  progress = null,
  delay = 0 
}) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Box
        bg={cardBg}
        borderRadius="2xl"
        p={6}
        border="1px solid"
        borderColor={borderColor}
        shadow="xl"
        position="relative"
        overflow="hidden"
        _hover={{
          transform: "translateY(-4px)",
          shadow: "2xl",
        }}
        transition="all 0.3s ease-in-out"
      >
        {/* Background gradient */}
        <Box
          position="absolute"
          top={0}
          right={0}
          w="100px"
          h="100px"
          bg={gradient}
          borderRadius="full"
          opacity={0.1}
          transform="translate(30px, -30px)"
        />
        
        <VStack align="stretch" spacing={4}>
          <HStack justify="space-between">
            <Box
              p={3}
              bg={gradient}
              borderRadius="xl"
              display="inline-flex"
              shadow="lg"
            >
              <Icon as={icon} w={6} h={6} color="white" />
            </Box>
            
            {trend && (
              <Badge 
                colorScheme={trend > 0 ? "green" : "red"} 
                variant="subtle"
                borderRadius="full"
                px={3}
                py={1}
              >
                <HStack spacing={1}>
                  <StatArrow type={trend > 0 ? "increase" : "decrease"} />
                  <Text fontSize="xs" fontWeight="bold">
                    {Math.abs(trend)}%
                  </Text>
                </HStack>
              </Badge>
            )}
          </HStack>
          
          <Box>
            <Text 
              fontSize="sm" 
              color="gray.500" 
              fontWeight="600"
              textTransform="uppercase"
              letterSpacing="wider"
            >
              {title}
            </Text>
            <Text 
              fontSize="3xl" 
              fontWeight="800" 
              bgGradient={gradient}
              bgClip="text"
              lineHeight="1"
              mt={1}
            >
              {value}
            </Text>
            <Text fontSize="sm" color="gray.600" mt={1}>
              {subtitle}
            </Text>
          </Box>
          
          {progress !== null && (
            <>
              <Divider />
              <Box>
                <Progress 
                  value={progress} 
                  colorScheme="brand" 
                  borderRadius="full"
                  bg="gray.100"
                  size="sm"
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  {progress}% del objetivo
                </Text>
              </Box>
            </>
          )}
        </VStack>
      </Box>
    </MotionBox>
  );
};

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    totalClientes: 0,
    totalPrestamos: 0,
    saldoTotal: 0,
    montoTotal: 0,
    totalPagado: 0,
    solicitudesPendientes: 0,
    solicitudesAprobadas: 0,
    solicitudesTotal: 0
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get(`${API}/dashboard`);
        setMetrics(response.data);
      } catch (error) {
        console.error("Error fetching dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6} mb={8}>
        {[...Array(4)].map((_, i) => (
          <Box key={i} h="200px" bg="gray.200" borderRadius="2xl" />
        ))}
      </Grid>
    );
  }

  // Cálculos adicionales
  const porcentajePagado = metrics.montoTotal > 0 
    ? Math.round((metrics.totalPagado / metrics.montoTotal) * 100) 
    : 0;
    
  const promedioSaldoPorPrestamo = metrics.totalPrestamos > 0
    ? (metrics.saldoTotal / metrics.totalPrestamos).toFixed(0)
    : 0;

  return (
    <Grid 
      templateColumns="repeat(auto-fit, minmax(280px, 1fr))" 
      gap={6} 
      mb={8}
    >
      <MetricCard
        title="Total Clientes"
        value={metrics.totalClientes.toLocaleString()}
        subtitle="Clientes activos"
        icon={UsersIcon}
        gradient="linear(to-br, brand.500, brand.600)"
        trend={12}
        delay={0}
      />
      
      <MetricCard
        title="Préstamos Activos"
        value={metrics.totalPrestamos.toLocaleString()}
        subtitle={`Promedio: $${Number(promedioSaldoPorPrestamo).toLocaleString()}`}
        icon={CreditCardIcon}
        gradient="linear(to-br, accent.500, accent.600)"
        delay={0.1}
      />
      
      <MetricCard
        title="Saldo Total"
        value={`$${metrics.saldoTotal.toLocaleString()}`}
        subtitle={`${porcentajePagado}% recuperado`}
        icon={TrendingUpIcon}
        gradient="linear(to-br, green.500, green.600)"
        progress={porcentajePagado}
        trend={8}
        delay={0.2}
      />
      
      <MetricCard
        title="Solicitudes"
        value={metrics.solicitudesTotal.toLocaleString()}
        subtitle={`${metrics.solicitudesPendientes} pendientes`}
        icon={ClockIcon}
        gradient="linear(to-br, orange.500, orange.600)"
        delay={0.3}
      />
    </Grid>
  );
}