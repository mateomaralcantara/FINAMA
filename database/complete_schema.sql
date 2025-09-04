-- =====================================================
-- SCHEMA COMPLETO PARA FINAMA v2.0
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- Crear tablas básicas si no existen
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    telefono VARCHAR(15),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prestamos (
    id SERIAL PRIMARY KEY,
    cliente_id INT REFERENCES clientes(id) ON DELETE CASCADE,
    monto NUMERIC(12,2) NOT NULL,
    tasa NUMERIC(5,2) NOT NULL,
    cuotas INT NOT NULL,
    frecuencia VARCHAR(20) NOT NULL CHECK (frecuencia IN ('diario', 'semanal', 'quincenal', 'mensual')),
    saldo NUMERIC(12,2) NOT NULL,
    fecha_inicio DATE,
    solicitud_origen_id INT, -- Se agregará la FK después
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pagos (
    id SERIAL PRIMARY KEY,
    prestamo_id INT REFERENCES prestamos(id) ON DELETE CASCADE,
    fecha_pago DATE DEFAULT CURRENT_DATE,
    monto NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Nueva tabla para solicitudes de préstamos
CREATE TABLE IF NOT EXISTS solicitudes_prestamos (
    id SERIAL PRIMARY KEY,
    tipo_solicitud VARCHAR(20) NOT NULL CHECK (tipo_solicitud IN ('nuevo_cliente', 'prestamo_adicional', 'renovacion')),
    cliente_id INT REFERENCES clientes(id) ON DELETE CASCADE,
    prestamo_original_id INT REFERENCES prestamos(id) ON DELETE SET NULL,
    
    -- Datos del préstamo solicitado
    monto NUMERIC(12,2) NOT NULL,
    tasa NUMERIC(5,2) NOT NULL,
    cuotas INT NOT NULL,
    frecuencia VARCHAR(20) NOT NULL CHECK (frecuencia IN ('diario', 'semanal', 'quincenal', 'mensual')),
    
    -- Datos del solicitante (para nuevos clientes)
    nombre_solicitante VARCHAR(100),
    email_solicitante VARCHAR(100),
    telefono_solicitante VARCHAR(15),
    
    -- Información adicional
    ingresos_mensuales NUMERIC(12,2),
    referencias TEXT,
    motivo_solicitud TEXT,
    
    -- Estado y procesamiento
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_revision', 'aprobada', 'rechazada')),
    comentarios TEXT,
    
    -- Fechas
    fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_procesamiento TIMESTAMP WITH TIME ZONE,
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar FK de solicitud_origen_id a prestamos
ALTER TABLE prestamos ADD CONSTRAINT fk_prestamos_solicitud 
    FOREIGN KEY (solicitud_origen_id) REFERENCES solicitudes_prestamos(id);

-- =====================================================
-- ÍNDICES PARA MEJOR PERFORMANCE
-- =====================================================

-- Índices para clientes
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_created_at ON clientes(created_at);

-- Índices para préstamos
CREATE INDEX IF NOT EXISTS idx_prestamos_cliente ON prestamos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_prestamos_saldo ON prestamos(saldo);
CREATE INDEX IF NOT EXISTS idx_prestamos_fecha_inicio ON prestamos(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_prestamos_solicitud ON prestamos(solicitud_origen_id);

-- Índices para pagos
CREATE INDEX IF NOT EXISTS idx_pagos_prestamo ON pagos(prestamo_id);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON pagos(fecha_pago);

-- Índices para solicitudes
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes_prestamos(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_cliente ON solicitudes_prestamos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_tipo ON solicitudes_prestamos(tipo_solicitud);
CREATE INDEX IF NOT EXISTS idx_solicitudes_fecha ON solicitudes_prestamos(fecha_solicitud);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_clientes_updated_at ON clientes;
CREATE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prestamos_updated_at ON prestamos;
CREATE TRIGGER update_prestamos_updated_at
    BEFORE UPDATE ON prestamos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_solicitudes_updated_at ON solicitudes_prestamos;
CREATE TRIGGER update_solicitudes_updated_at
    BEFORE UPDATE ON solicitudes_prestamos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCIONES DE NEGOCIO (STORED PROCEDURES)
-- =====================================================

-- Función para registrar un pago y actualizar saldo
CREATE OR REPLACE FUNCTION registrar_pago(
    p_prestamo_id INT,
    p_monto NUMERIC,
    p_fecha DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
    resultado JSON;
    saldo_actual NUMERIC;
BEGIN
    -- Verificar que el préstamo existe
    SELECT saldo INTO saldo_actual 
    FROM prestamos 
    WHERE id = p_prestamo_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('error', 'Préstamo no encontrado');
    END IF;
    
    -- Insertar el pago
    INSERT INTO pagos (prestamo_id, monto, fecha_pago)
    VALUES (p_prestamo_id, p_monto, p_fecha);
    
    -- Actualizar saldo del préstamo
    UPDATE prestamos 
    SET saldo = saldo - p_monto,
        updated_at = NOW()
    WHERE id = p_prestamo_id;
    
    -- Obtener nuevo saldo
    SELECT saldo INTO saldo_actual 
    FROM prestamos 
    WHERE id = p_prestamo_id;
    
    resultado := json_build_object(
        'success', true,
        'mensaje', 'Pago registrado exitosamente',
        'nuevo_saldo', saldo_actual
    );
    
    RETURN resultado;
END;
$$ LANGUAGE plpgsql;

-- Función alternativa simple para restar saldo
CREATE OR REPLACE FUNCTION restar_saldo_prestamo(
    p_prestamo_id INT,
    p_monto NUMERIC
)
RETURNS VOID AS $$
BEGIN
    UPDATE prestamos 
    SET saldo = saldo - p_monto,
        updated_at = NOW()
    WHERE id = p_prestamo_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- =====================================================

-- Insertar algunos clientes de ejemplo
INSERT INTO clientes (nombre, email, telefono) VALUES
('Juan Pérez', 'juan.perez@email.com', '555-0101'),
('María González', 'maria.gonzalez@email.com', '555-0102'),
('Carlos López', 'carlos.lopez@email.com', '555-0103')
ON CONFLICT DO NOTHING;

-- =====================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE clientes IS 'Tabla de clientes del sistema financiero';
COMMENT ON TABLE prestamos IS 'Préstamos otorgados a los clientes';
COMMENT ON TABLE pagos IS 'Registro de pagos realizados por los clientes';
COMMENT ON TABLE solicitudes_prestamos IS 'Solicitudes de préstamos con diferentes tipos: nuevo_cliente, prestamo_adicional, renovacion';

COMMENT ON COLUMN solicitudes_prestamos.tipo_solicitud IS 'Tipo: nuevo_cliente, prestamo_adicional, renovacion';
COMMENT ON COLUMN solicitudes_prestamos.estado IS 'Estado: pendiente, en_revision, aprobada, rechazada';

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Mostrar resumen de tablas creadas
SELECT 
    schemaname as schema,
    tablename as tabla,
    tableowner as propietario
FROM pg_tables 
WHERE tablename IN ('clientes', 'prestamos', 'pagos', 'solicitudes_prestamos')
ORDER BY tablename;

-- Mostrar funciones creadas
SELECT routine_name as funcion, routine_type as tipo
FROM information_schema.routines
WHERE routine_name IN ('registrar_pago', 'restar_saldo_prestamo', 'update_updated_at_column');

-- =====================================================
-- ¡SCHEMA COMPLETO LISTO!
-- =====================================================