-- Schema adicional para solicitudes de préstamos y renovaciones
-- Ejecutar en Supabase SQL Editor

-- Tabla para solicitudes de préstamos
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

-- Agregar columna a la tabla prestamos para referenciar solicitud origen
ALTER TABLE prestamos ADD COLUMN IF NOT EXISTS solicitud_origen_id INT REFERENCES solicitudes_prestamos(id);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes_prestamos(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_cliente ON solicitudes_prestamos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_tipo ON solicitudes_prestamos(tipo_solicitud);
CREATE INDEX IF NOT EXISTS idx_solicitudes_fecha ON solicitudes_prestamos(fecha_solicitud);

-- Función para actualizar updated_at automáticamente  
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_solicitudes_updated_at ON solicitudes_prestamos;
CREATE TRIGGER update_solicitudes_updated_at
    BEFORE UPDATE ON solicitudes_prestamos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE solicitudes_prestamos IS 'Solicitudes de préstamos con diferentes tipos: nuevo cliente, adicional, renovación';
COMMENT ON COLUMN solicitudes_prestamos.tipo_solicitud IS 'Tipo: nuevo_cliente, prestamo_adicional, renovacion';
COMMENT ON COLUMN solicitudes_prestamos.estado IS 'Estado: pendiente, en_revision, aprobada, rechazada';