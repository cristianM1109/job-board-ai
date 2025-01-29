# Folosește imaginea oficială Python
FROM python:3.9-slim

# Setează directorul de lucru
WORKDIR /app

# Copiază fișierul requirements.txt în container
COPY requirements.txt /app/

# Dezinstalează NumPy preinstalat și instalează versiunile exacte ale dependențelor
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir numpy==1.24.4 \
    && pip install --no-cache-dir -r requirements.txt

# Copiază restul codului aplicației în container
COPY . /app/

# Expune portul Flask (8000)
EXPOSE 8000

# Rulează aplicația Flask
CMD ["python", "app.py"]
