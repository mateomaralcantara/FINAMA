-- Insertar datos de demostración en las tablas ya creadas

-- Insertar clientes de ejemplo
INSERT INTO clientes (nombre, email, telefono) VALUES
('Juan Pérez', 'juan.perez@email.com', '555-0101'),
('María González', 'maria.gonzalez@email.com', '555-0102'),
('Carlos López', 'carlos.lopez@email.com', '555-0103'),
('Andrea Ruiz', 'andrea.ruiz@email.com', '555-0104'),
('Luis Martín', 'luis.martin@email.com', '555-0105')
ON CONFLICT DO NOTHING;

-- Insertar préstamos de ejemplo
INSERT INTO prestamos (cliente_id, monto, tasa, cuotas, frecuencia, fecha_inicio, saldo) VALUES
(1, 10000.00, 12.0, 12, 'mensual', '2024-01-15', 8500.00),
(2, 5000.00, 15.0, 6, 'quincenal', '2024-02-01', 3000.00),
(3, 15000.00, 10.0, 24, 'mensual', '2024-01-01', 12000.00),
(1, 8000.00, 18.0, 8, 'semanal', '2024-03-01', 6000.00)
ON CONFLICT DO NOTHING;

-- Insertar pagos de ejemplo
INSERT INTO pagos (prestamo_id, fecha_pago, monto) VALUES
(1, '2024-02-15', 500.00),
(1, '2024-03-15', 500.00),
(1, '2024-04-15', 500.00),
(2, '2024-02-15', 1000.00),
(2, '2024-03-01', 1000.00),
(3, '2024-02-01', 1500.00),
(3, '2024-03-01', 1500.00),
(4, '2024-03-08', 500.00),
(4, '2024-03-15', 500.00),
(4, '2024-03-22', 500.00),
(4, '2024-03-29', 500.00)
ON CONFLICT DO NOTHING;

-- Insertar solicitudes de ejemplo
INSERT INTO solicitudes_prestamos (
    tipo_solicitud, cliente_id, prestamo_original_id, monto, tasa, cuotas, frecuencia,
    nombre_solicitante, email_solicitante, telefono_solicitante, 
    ingresos_mensuales, referencias, motivo_solicitud, estado, fecha_solicitud
) VALUES
(
    'nuevo_cliente', NULL, NULL, 8000.00, 18.0, 12, 'mensual',
    'Ana Torres', 'ana.torres@email.com', '555-0106',
    25000.00, 'Comercio local establecido desde 2018', 'Expansión de negocio familiar', 
    'pendiente', '2024-03-01T10:00:00Z'
),
(
    'prestamo_adicional', 1, NULL, 15000.00, 15.0, 18, 'mensual',
    NULL, NULL, NULL,
    NULL, 'Cliente con buen historial de pagos', 'Inversión en inventario para temporada alta', 
    'en_revision', '2024-03-02T14:30:00Z'
),
(
    'renovacion', 2, 2, 6000.00, 12.0, 8, 'quincenal',
    NULL, NULL, NULL,
    NULL, 'Solicita mejores condiciones', 'Renovación con tasa más baja', 
    'aprobada', '2024-02-28T16:45:00Z'
),
(
    'nuevo_cliente', NULL, NULL, 12000.00, 16.0, 15, 'mensual',
    'Roberto Silva', 'roberto.silva@email.com', '555-0107',
    30000.00, 'Empresa de servicios con 5 años de experiencia', 'Compra de equipo profesional', 
    'pendiente', '2024-03-03T09:15:00Z'
),
(
    'prestamo_adicional', 3, NULL, 5000.00, 14.0, 6, 'mensual',
    NULL, NULL, NULL,
    NULL, 'Cliente premium con excelente historial', 'Capital de trabajo adicional', 
    'rechazada', '2024-02-25T11:20:00Z'
)
ON CONFLICT DO NOTHING;