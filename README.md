# 🤖 Clansados Bot

Um bot do Discord que combina funcionalidades de seguimento de canais de voz com countdown automático!

## 📝 Descrição

Este bot oferece:
- 👥 Sistema de seguir canais de voz específicos
- 🔔 Notificações via DM quando alguém entra em canais seguidos
- 👤 Sistema de seguir usuários específicos
- 📱 Notificações quando usuários seguidos entram em qualquer canal
- 🎯 Notificações inteligentes (não notifica se você já está no canal)
- � Countdown automático diário com arte ASCII
- �💾 Persistência de dados em arquivo JSON
- 🔄 Comandos slash para fácil interação

## ✨ Funcionalidades

### 🎯 Comandos de Seguimento

- `/follow [channelId/userId/@usuario]` - Seguir um canal de voz ou usuário
- `/following` - Ver lista de canais/usuários que você está seguindo
- `/unfollow [channelId/userId/@usuario]` - Parar de seguir um canal ou usuário

### 📅 Countdown Automático

- **Agendamento automático**: Countdown enviado diariamente às 8:00 AM UTC
- **Arte ASCII**: Visualização estilizada com imagens geradas
- **Data alvo**: 26 de maio de 2026
- **Configuração opcional**: Configure `CHANNEL_ID` no .env para ativar

### Recursos

- **Notificações inteligentes**: Receba DMs quando atividade acontecer nos canais/usuários seguidos
- **Não spam**: Você não será notificado se já estiver no mesmo canal onde alguém entrou
- **Auto-exclusão**: Você não recebe notificações sobre suas próprias entradas em canais
- **Persistência de dados**: Todas as configurações são salvas em arquivo JSON
- **Suporte a canais e usuários**: Siga tanto canais específicos quanto usuários
- **Menções suportadas**: Use @usuario ao invés de copiar IDs
- **Interface moderna**: Comandos slash para fácil uso
- **Sistema robusto**: Tratamento de erros e validação de IDs

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+ ou Docker
- Um bot do Discord criado no [Discord Developer Portal](https://discord.com/developers/applications)
- Token do bot

### 📋 Configuração do Bot Discord

1. Acesse o [Discord Developer Portal](https://discord.com/developers/applications)
2. Crie uma nova aplicação
3. Vá para a aba "Bot" e crie um bot
4. Copie o token do bot
5. Em "Privileged Gateway Intents", habilite:
   - Server Members Intent
   - Message Content Intent
6. Em "Bot Permissions", selecione:
   - Send Messages
   - Use Slash Commands
   - Connect (para monitorar canais de voz)
   - View Channels

### 🔧 Configuração Local

1. **Clone o repositório**
   ```bash
   git clone https://github.com/adautovjr/clansados-discord-bot.git
   cd clansados-discord-bot
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
   CHANNEL_ID=id_do_canal_para_countdown (opcional)
   ```
   
   **Configurações:**
   - `DISCORD_TOKEN`: **Obrigatório** - Token do seu bot Discord
   - `CHANNEL_ID`: **Opcional** - ID do canal onde o countdown será enviado
     - Se não configurado, apenas as funcionalidades de seguimento estarão ativas
     - Se configurado, o countdown será enviado automaticamente às 8:00 AM UTC

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
   docker build -t clansados-bot .
   docker run -d --env-file .env --name clansados-bot clansados-bot
   ```

## 📖 Como Usar

### 1. Convidar o Bot

Use o link de convite gerado no Discord Developer Portal com as permissões necessárias.

### 2. Comandos Disponíveis

#### `/follow [channelId/userId/@usuario]`
Segue um canal de voz ou usuário para receber notificações:

```
# Usando ID do canal
/follow 123456789012345678

# Usando ID do usuário  
/follow 987654321098765432

# Usando menção do usuário (mais fácil!)
/follow @joao
```

- **Para canal**: Você receberá uma DM sempre que alguém entrar neste canal
- **Para usuário**: Você receberá uma DM sempre que este usuário entrar em qualquer canal

#### `/following`
Mostra todos os canais e usuários que você está seguindo:

```
/following
```

#### `/unfollow [channelId/userId/@usuario]`
Para de seguir um canal ou usuário:

```
# Usando ID
/unfollow 123456789012345678

# Usando menção (mais fácil!)
/unfollow @joao
```

### 3. Como Usar

#### 🎯 **Método Mais Fácil - Menções**:
Para seguir usuários, simplesmente mencione eles:
- `/follow @joao` - Segue o usuário João
- `/unfollow @maria` - Para de seguir a usuária Maria

#### 📋 **Método Tradicional - IDs**:

##### ID de Canal de Voz:
1. Habilite o "Modo Desenvolvedor" no Discord:
   - Configurações do Discord → Avançado → Modo Desenvolvedor
2. Clique com botão direito no canal de voz
3. Selecione "Copiar ID"

##### ID de Usuário:
1. Com o Modo Desenvolvedor habilitado
2. Clique com botão direito no usuário
3. Selecione "Copiar ID do Usuário"

> 💡 **Dica**: É muito mais fácil usar menções (@usuario) do que copiar IDs!

## 💾 Persistência de Dados

O bot salva todas as configurações no arquivo `followers.json` que é criado automaticamente. A estrutura é:

```json
{
  "channelId1": ["userId1", "userId2"],
  "userId1": ["followerId1", "followerId2"]
}
```

Este arquivo mantém o estado mesmo após reinicialização do bot.

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

Encontrou um bug? Abra uma [issue](https://github.com/adautovjr/clansados-discord-bot/issues) descrevendo:

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
