FROM node:20-alpine

WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia todo o código para o container
COPY . .

# Expõe a porta padrão do servidor de desenvolvimento (ajuste se for diferente)
EXPOSE 3000

# Adicionamos os parâmetros para o Vite liberar acesso total no Docker
CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "3000"]