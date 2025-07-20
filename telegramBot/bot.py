from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes
import logging
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Configurar logs para debug
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Comando /start - Mensagem de boas-vindas com botão para o app"""
    
    welcome_text = """🎉 Bem-vindo ao SplitOn!

Divida suas contas de forma fácil e rápida com seus amigos.

Clique no botão abaixo para abrir o app:"""
    
    # Criar botão inline que abre o app
    keyboard = [
        [InlineKeyboardButton("🚀 Abrir SplitOn", url="https://t.me/SplitOn_ton_bot/SplitOn")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    # Enviar mensagem com botão
    await update.message.reply_text(
        text=welcome_text,
        reply_markup=reply_markup
    )
    
    # Log para debug
    user = update.effective_user
    print(f"Usuário {user.first_name} ({user.id}) executou /start")

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Comando /help - Ajuda adicional"""
    help_text = """ℹ️ Como usar o SplitOn:

1. Clique em "Abrir SplitOn" 
2. Cadastre suas despesas
3. Adicione seus amigos
4. Divida as contas automaticamente

Digite /start para voltar ao início."""
    
    await update.message.reply_text(help_text)

def main():
    """Função principal do bot"""
    
    # Obter token do bot das variáveis de ambiente
    BOT_TOKEN = os.getenv("BOT_TOKEN")
    
    if not BOT_TOKEN:
        print("❌ Erro: BOT_TOKEN não encontrado nas variáveis de ambiente!")
        print("Configure a variável BOT_TOKEN no Railway.")
        return
    
    # Criar aplicação
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Adicionar handlers dos comandos
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    
    # Iniciar o bot
    print("🤖 Bot SplitOn iniciado!")
    print("Pressione Ctrl+C para parar.")
    
    # Executar o bot
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()