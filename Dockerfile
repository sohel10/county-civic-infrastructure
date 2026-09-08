FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    sqlite3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy all source files
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY README.md REPRODUCIBILITY.md DATA_PIPELINE.md ./

# Expose ports
EXPOSE 5005 8000

# Create startup script
RUN echo '#!/bin/bash\n\
cd /app/backend && python app.py &\n\
cd /app/frontend && python -m http.server 8000\n\
' > /app/start.sh && chmod +x /app/start.sh

# Start both services
CMD ["/app/start.sh"]
