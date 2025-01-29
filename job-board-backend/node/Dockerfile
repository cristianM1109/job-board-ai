# Imaginea oficială Node.js
FROM node:20

# Setăm directorul de lucru
WORKDIR /app

# Copiem fișierele esențiale pentru instalarea dependințelor
COPY package*.json ./

# Instalăm dependințele
RUN npm install

# Copiem întregul cod al aplicației în container
COPY . .

# Expunem portul pe care rulează aplicația
EXPOSE 5000

# Pornim aplicația
CMD ["node", "server.js"]
