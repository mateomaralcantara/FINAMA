#!/bin/bash

# Script para configurar supervisor para el sistema FinaMa

echo "Configurando Supervisor para FinaMa..."

# Crear archivo de configuración del backend
cat > /etc/supervisor/conf.d/finama-backend.conf << EOF
[program:finama-backend]
command=npx nodemon src/index.js
directory=/app/backend
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/finama-backend.err.log
stdout_logfile=/var/log/supervisor/finama-backend.out.log
user=root
environment=NODE_ENV=production
EOF

# Crear archivo de configuración del frontend
cat > /etc/supervisor/conf.d/finama-frontend.conf << EOF
[program:finama-frontend]
command=npm start
directory=/app/frontend
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/finama-frontend.err.log
stdout_logfile=/var/log/supervisor/finama-frontend.out.log
user=root
environment=PORT=3000
EOF

# Recargar configuración de supervisor
supervisorctl reread
supervisorctl update

echo "✅ Supervisor configurado correctamente"
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:3000"

# Mostrar estado
supervisorctl status