# 🤖 How Much Left Discord Bot

Um bot do Discord que faz uma contagem regressiva para **26 de maio de 2026** com arte ASCII bonita e atualizações diárias automáticas!

## 📝 Descrição

Este bot:
- 🗓️ Conta os dias restantes até 26 de maio de 2026
- 🎨 Mostra a contagem com arte ASCII linda
- 🔄 Atualiza automaticamente todos os dias às 8:00 AM (UTC)
- 🧹 Remove a mensagem anterior para manter o canal limpo
- 📅 Detecta quando a data já passou e mostra quantos dias se passaram

## ✨ Funcionalidades

- **Contagem regressiva visual**: Arte ASCII para números grandes e legíveis
- **Atualizações automáticas**: Agendamento com cron para envios diários
- **Limpeza inteligente**: Remove mensagens antigas automaticamente
- **Proteção contra spam**: Não envia múltiplas mensagens no mesmo dia
- **Docker ready**: Configurado para deploy fácil com Docker

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+ ou Docker
- Um bot do Discord criado no [Discord Developer Portal](https://discord.com/developers/applications)
- Token do bot e ID do canal onde deseja enviar as mensagens

### 📋 Configuração do Bot Discord

1. Acesse o [Discord Developer Portal](https://discord.com/developers/applications)
2. Crie uma nova aplicação
3. Vá para a aba "Bot" e crie um bot
4. Copie o token do bot
5. Em "Privileged Gateway Intents", habilite:
   - Message Content Intent
   - Server Members Intent (opcional)

### 🔧 Configuração Local

1. **Clone o repositório**
   ```bash
   git clone https://github.com/adautovjr/how-much-left-disc-bot.git
   cd how-much-left-disc-bot
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env
   ```
   
   Edite o arquivo `.env` com suas informações:
   ```env
   DISCORD_TOKEN=seu_token_do_bot_aqui
   CHANNEL_ID=id_do_canal_aqui
   ```

4. **Execute o bot**
   ```bash
   # Desenvolvimento (com auto-reload)
   npm run dev
   
   # Produção
   npm start
   ```

### 🐳 Executar com Docker

1. **Configure o .env** (mesmo processo acima)

2. **Execute com Docker Compose**
   ```bash
   docker-compose up -d
   ```

   Ou construa e execute manualmente:
   ```bash
   docker build -t discord-countdown-bot .
   docker run -d --env-file .env --name countdown-bot discord-countdown-bot
   ```

## 🛠️ Como Obter o ID do Canal

1. Habilite o "Modo Desenvolvedor" no Discord:
   - Configurações do Discord → Avançado → Modo Desenvolvedor
2. Clique com o botão direito no canal desejado
3. Selecione "Copiar ID"

## 📅 Personalizando a Data

Para alterar a data alvo, edite a linha 17 no arquivo `index.js`:

```javascript
const targetDate = new Date('May 26, 2026');
```

Para alterar o horário das mensagens diárias, edite a linha 246:

```javascript
cron.schedule('0 8 * * *', sendCountdownMessage, {
```

O formato é: `minuto hora dia mês dia_da_semana`

## 🤝 Como Contribuir

1. **Fork** o projeto
2. **Crie** uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. **Abra** um Pull Request

### 💡 Ideias para Contribuições

- Adicionar mais estilos de arte ASCII
- Implementar múltiplas datas de contagem
- Adicionar comandos de slash
- Melhorar as mensagens com emojis e formatação
- Adicionar suporte a diferentes fusos horários
- Criar temas personalizáveis

## 📋 Scripts Disponíveis

- `npm start` - Executa o bot em produção
- `npm run dev` - Executa com nodemon para desenvolvimento
- `npm test` - Executa os testes (em desenvolvimento)

## 🔧 Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Discord.js v14** - Biblioteca para interação com a API do Discord
- **node-cron** - Agendamento de tarefas
- **dotenv** - Gerenciamento de variáveis de ambiente
- **Docker** - Containerização

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🐛 Reportar Bugs

Encontrou um bug? Abra uma [issue](https://github.com/adautovjr/how-much-left-disc-bot/issues) descrevendo:

- O que aconteceu
- O que era esperado
- Passos para reproduzir
- Screenshots (se aplicável)

## 📞 Suporte

Se você precisar de ajuda:

- 📚 Consulte a [documentação do Discord.js](https://discord.js.org/)
- 🐛 Abra uma issue no GitHub
- 💬 Entre em contato com [@adautovjr](https://github.com/adautovjr)

---

Feito com ❤️ por [adautovjr](https://github.com/adautovjr)
