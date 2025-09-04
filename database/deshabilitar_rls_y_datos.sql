-- Deshabilitar RLS para desarrollo y agregar datos de ejemplo

-- Deshabilitar RLS en todas las tablas para facilitar desarrollo
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE prestamos DISABLE ROW LEVEL SECURITY;
ALTER TABLE pagos DISABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes_prestamos DISABLE ROW LEVEL SECURITY;

-- Limpiar datos existentes (por si acaso)
DELETE FROM pagos;
DELETE FROM prestamos;
DELETE FROM solicitudes_prestamos;
DELETE FROM clientes;

-- Insertar clientes de ejemplo
INSERT INTO clientes (nombre, email, telefono) VALUES
('Ana García', 'ana.garcia@empresa.com', '555-1234'),
('Carlos Mendoza', 'carlos.mendoza@negocio.com', '555-5678'),
('María Rodríguez', 'maria.rodriguez@comercio.com', '555-9012'),
('Luis Fernández', 'luis.fernandez@startup.com', '555-3456'),
('Sofia Herrera', 'sofia.herrera@pyme.com', '555-7890');

-- Insertar préstamos de ejemplo
INSERT INTO prestamos (cliente_id, monto, tasa, cuotas, frecuencia, fecha_inicio, saldo) VALUES
(1, 15000.00, 18.0, 12, 'mensual', '2024-01-15', 12500.00),
(2, 8000.00, 15.0, 6, 'quincenal', '2024-02-01', 5000.00),
(3, 25000.00, 12.0, 24, 'mensual', '2024-01-01', 20000.00),
(1, 5000.00, 20.0, 8, 'semanal', '2024-03-01', 3500.00),
(4, 12000.00, 16.0, 15, 'mensual', '2024-02-15', 10000.00);

-- Insertar pagos de ejemplo
INSERT INTO pagos (prestamo_id, fecha_pago, monto) VALUES
-- Pagos para préstamo 1 (Ana García - $15,000)
(1, '2024-02-15', 1250.00),
(1, '2024-03-15', 1250.00),
-- Pagos para préstamo 2 (Carlos Mendoza - $8,000)
(2, '2024-02-15', 1500.00),
(2, '2024-03-01', 1500.00),
-- Pagos para préstamo 3 (María Rodríguez - $25,000)
(3, '2024-02-01', 2500.00),
(3, '2024-03-01', 2500.00),
-- Pagos para préstamo 4 (Ana García - $5,000)
(4, '2024-03-08', 500.00),
(4, '2024-03-15', 500.00),
(4, '2024-03-22', 500.00),
-- Pagos para préstamo 5 (Luis Fernández - $12,000)
(5, '2024-03-15', 1000.00),
(5, '2024-04-15', 1000.00);

-- Insertar solicitudes de ejemplo
INSERT INTO solicitudes_prestamos (
    tipo_solicitud, cliente_id, prestamo_original_id, monto, tasa, cuotas, frecuencia,
    nombre_solicitante, email_solicitante, telefono_solicitante, 
    ingresos_mensuales, referencias, motivo_solicitud, estado, fecha_solicitud
) VALUES
-- Solicitud de nuevo cliente
(
    'nuevo_cliente', NULL, NULL, 10000.00, 17.0, 12, 'mensual',
    'Roberto Silva', 'roberto.silva@consultoria.com', '555-2468',
    35000.00, 'Empresa consultora con 3 años de experiencia', 'Expansión de servicios profesionales', 
    'pendiente', '2024-03-10T10:30:00Z'
),
-- Solicitud de préstamo adicional
(
    'prestamo_adicional', 2, NULL, 6000.00, 14.0, 9, 'mensual',
    NULL, NULL, NULL,
    NULL, 'Cliente con excelente historial de pagos', 'Capital de trabajo adicional para inventario', 
    'en_revision', '2024-03-12T14:15:00Z'
),
-- Solicitud de renovación
(
    'renovacion', 1, 1, 18000.00, 15.0, 15, 'mensual',
    NULL, NULL, NULL,
    NULL, 'Solicita renovación con mejor tasa', 'Renovación con condiciones mejoradas', 
    'aprobada', '2024-03-08T16:45:00Z'
),
-- Otra solicitud de nuevo cliente
(
    'nuevo_cliente', NULL, NULL, 7500.00, 19.0, 10, 'quincenal',
    'Patricia Vega', 'patricia.vega@tienda.com', '555-8024',
    28000.00, 'Tienda de ropa con 2 años de operación', 'Compra de mercancía para nueva temporada', 
    'pendiente', '2024-03-11T09:20:00Z'
),
-- Solicitud rechazada para ejemplo
(
    'prestamo_adicional', 3, NULL, 30000.00, 12.0, 18, 'mensual',
    NULL, NULL, NULL,
    NULL, 'Solicitud de monto alto', 'Expansión significativa del negocio', 
    'rechazada', '2024-03-05T11:10:00Z'
);

-- Verificar que todo se insertó correctamente
SELECT 'CLIENTES' as tabla, COUNT(*) as total FROM clientes
UNION ALL
SELECT 'PRESTAMOS' as tabla, COUNT(*) as total FROM prestamos
UNION ALL
SELECT 'PAGOS' as tabla, COUNT(*) as total FROM pagos
UNION ALL
SELECT 'SOLICITUDES' as tabla, COUNT(*) as total FROM solicitudes_prestamos;