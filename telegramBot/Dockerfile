# Dockerfile para Bot Telegram Spliton - Railway Deploy
FROM python:3.11-slim

# Definir diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar todo o contexto do telegramBot
COPY telegramBot/ .

# Instalar dependências Python
RUN pip install --no-cache-dir -r requirements.txt

# Criar arquivo .env vazio (será preenchido pelo Railway)
RUN touch .env

# Expor porta (opcional)
EXPOSE 8000

# Comando para iniciar o bot
CMD ["python", "bot.py"] 