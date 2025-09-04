-- Crear tabla de solicitudes de préstamos
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

-- Agregar FK de solicitud_origen_id a prestamos si no existe
ALTER TABLE prestamos ADD COLUMN IF NOT EXISTS solicitud_origen_id INT;
ALTER TABLE prestamos DROP CONSTRAINT IF EXISTS fk_prestamos_solicitud;
ALTER TABLE prestamos ADD CONSTRAINT fk_prestamos_solicitud 
    FOREIGN KEY (solicitud_origen_id) REFERENCES solicitudes_prestamos(id);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes_prestamos(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_cliente ON solicitudes_prestamos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_tipo ON solicitudes_prestamos(tipo_solicitud);

-- Funciones para manejo de pagos
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
    SELECT saldo INTO saldo_actual 
    FROM prestamos 
    WHERE id = p_prestamo_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('error', 'Préstamo no encontrado');
    END IF;
    
    INSERT INTO pagos (prestamo_id, monto, fecha_pago)
    VALUES (p_prestamo_id, p_monto, p_fecha);
    
    UPDATE prestamos 
    SET saldo = saldo - p_monto,
        updated_at = NOW()
    WHERE id = p_prestamo_id;
    
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