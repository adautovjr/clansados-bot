import { Client, GatewayIntentBits, Events, SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { config } from 'dotenv';
import fs from 'fs/promises';
import { initializeCountdown } from './countdown.js';

config();

// Função para criar timestamp formatado
function getFormattedTimestamp() {
    return new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// Função para logs detalhados
function logMessage(type, sender, recipient, message, extra = {}) {
    const timestamp = getFormattedTimestamp();
    const logData = {
        timestamp,
        type,
        sender: sender || 'SISTEMA',
        recipient: recipient || 'N/A',
        message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
        ...extra
    };
    
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${sender} -> ${recipient} | ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);
    
    if (extra && Object.keys(extra).length > 0) {
        console.log(`[${timestamp}] EXTRA:`, extra);
    }
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Arquivo para armazenar os dados de seguidores
const DATA_FILE = './followers.json';

// Estrutura: { channelId: [userId1, userId2, ...], userId: [followerId1, followerId2, ...] }
let followersData = {};

// Carrega os dados do arquivo JSON
async function loadFollowersData() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        followersData = JSON.parse(data);
        
        const totalFollowers = Object.keys(followersData).length;
        const totalFollowerships = Object.values(followersData).reduce((acc, arr) => acc + arr.length, 0);
        
        logMessage('DATA_LOAD', 'SISTEMA', 'ARQUIVO', 'Dados de seguidores carregados com sucesso', {
            file: DATA_FILE,
            totalTargets: totalFollowers,
            totalFollowerships: totalFollowerships,
            dataKeys: Object.keys(followersData).slice(0, 5) // Primeiras 5 chaves para debug
        });
        
        console.log('Dados de seguidores carregados com sucesso');
    } catch (error) {
        if (error.code === 'ENOENT') {
            logMessage('DATA_CREATE', 'SISTEMA', 'ARQUIVO', 'Arquivo de dados não encontrado, criando novo', {
                file: DATA_FILE
            });
            
            console.log('Arquivo de dados não encontrado, criando novo...');
            followersData = {};
            await saveFollowersData();
        } else {
            logMessage('DATA_ERROR', 'SISTEMA', 'ARQUIVO', 'Erro ao carregar dados', {
                file: DATA_FILE,
                error: error.message,
                code: error.code
            });
            
            console.error('Erro ao carregar dados:', error);
        }
    }
}

// Salva os dados no arquivo JSON
async function saveFollowersData() {
    try {
        const totalFollowers = Object.keys(followersData).length;
        const totalFollowerships = Object.values(followersData).reduce((acc, arr) => acc + arr.length, 0);
        
        await fs.writeFile(DATA_FILE, JSON.stringify(followersData, null, 2));
        
        logMessage('DATA_SAVE', 'SISTEMA', 'ARQUIVO', 'Dados de seguidores salvos com sucesso', {
            file: DATA_FILE,
            totalTargets: totalFollowers,
            totalFollowerships: totalFollowerships,
            fileSize: Buffer.byteLength(JSON.stringify(followersData, null, 2), 'utf8')
        });
        
        console.log('Dados de seguidores salvos com sucesso');
    } catch (error) {
        logMessage('DATA_SAVE_ERROR', 'SISTEMA', 'ARQUIVO', 'Erro ao salvar dados', {
            file: DATA_FILE,
            error: error.message,
            code: error.code
        });
        
        console.error('Erro ao salvar dados:', error);
    }
}

// Adiciona um seguidor
function addFollower(targetId, followerId) {
    if (!followersData[targetId]) {
        followersData[targetId] = [];
    }
    
    if (!followersData[targetId].includes(followerId)) {
        followersData[targetId].push(followerId);
        return true;
    }
    return false;
}

// Remove um seguidor
function removeFollower(targetId, followerId) {
    if (followersData[targetId]) {
        const index = followersData[targetId].indexOf(followerId);
        if (index > -1) {
            followersData[targetId].splice(index, 1);
            if (followersData[targetId].length === 0) {
                delete followersData[targetId];
            }
            return true;
        }
    }
    return false;
}

// Obtém lista de canais/usuários que um usuário está seguindo
function getFollowing(userId) {
    const following = [];
    for (const [targetId, followers] of Object.entries(followersData)) {
        if (followers.includes(userId)) {
            following.push(targetId);
        }
    }
    return following;
}

// Extrai o ID do usuário de uma menção ou retorna o ID se já for um ID válido
function extractUserId(input) {
    // Verifica se é uma menção de usuário: <@123456789> ou <@!123456789>
    const mentionMatch = input.match(/^<@!?(\d+)>$/);
    if (mentionMatch) {
        return mentionMatch[1];
    }
    
    // Se não for uma menção, retorna o input original (assumindo que é um ID)
    return input;
}

// Valida se um ID é válido (somente números, 17-19 dígitos)
function isValidDiscordId(id) {
    const idRegex = /^\d{17,19}$/;
    return idRegex.test(id);
}

// Valida entrada do usuário e retorna objeto com resultado
async function validateUserInput(input, interaction) {
    const timestamp = getFormattedTimestamp();
    const userId = interaction.user.id;
    const username = interaction.user.username;
    
    logMessage('VALIDATION', username, 'SISTEMA', `Validando entrada: "${input}"`, { userId, input });
    
    // Extrai o ID (seja menção ou ID direto)
    const extractedId = extractUserId(input);
    
    // Verifica se o ID extraído é válido
    if (!isValidDiscordId(extractedId)) {
        logMessage('VALIDATION_ERROR', username, 'SISTEMA', 'ID inválido - formato incorreto', { 
            userId, 
            input, 
            extractedId,
            reason: 'Invalid Discord ID format'
        });
        
        return {
            valid: false,
            error: `❌ **ID inválido!**\n\n**Formato recebido:** \`${input}\`\n**ID extraído:** \`${extractedId}\`\n\n**Formatos aceitos:**\n• ID direto: \`123456789012345678\` (17-19 dígitos)\n• Menção: \`@usuario\`\n\n**Exemplo:** \`/follow @joao\` ou \`/follow 123456789012345678\``
        };
    }
    
    // Verifica se é um canal válido
    let targetType = null;
    let targetName = '';
    let targetInfo = {};
    
    try {
        const channel = await client.channels.fetch(extractedId);
        if (channel) {
            // Verifica se é um canal de voz
            if (channel.type !== 2) { // 2 = GUILD_VOICE
                logMessage('VALIDATION_ERROR', username, 'SISTEMA', 'Canal não é de voz', { 
                    userId, 
                    channelId: extractedId,
                    channelType: channel.type,
                    channelName: channel.name
                });
                
                return {
                    valid: false,
                    error: `❌ **Canal inválido!**\n\n**Canal encontrado:** \`${channel.name}\`\n**Tipo:** \`${channel.type === 0 ? 'Texto' : channel.type === 4 ? 'Categoria' : 'Outro'}\`\n\n**Apenas canais de voz são suportados!**\n\n**Como encontrar um canal de voz:**\n1. Habilite o Modo Desenvolvedor no Discord\n2. Clique com o botão direito em um canal de **VOZ**\n3. Selecione "Copiar ID"`
                };
            }
            
            targetType = 'canal';
            targetName = channel.name;
            targetInfo = {
                type: 'channel',
                id: extractedId,
                name: channel.name,
                guildId: channel.guildId
            };
            
            logMessage('VALIDATION_SUCCESS', username, 'SISTEMA', `Canal de voz válido encontrado: ${channel.name}`, targetInfo);
        }
    } catch (error) {
        // Não é um canal válido, vamos verificar se é um usuário
        try {
            const user = await client.users.fetch(extractedId);
            if (user) {
                // Verifica se não é um bot
                if (user.bot) {
                    logMessage('VALIDATION_ERROR', username, 'SISTEMA', 'Tentativa de seguir um bot', { 
                        userId, 
                        targetUserId: extractedId,
                        targetUsername: user.username
                    });
                    
                    return {
                        valid: false,
                        error: `❌ **Usuário inválido!**\n\n**Usuário encontrado:** \`${user.username}\`\n**Tipo:** Bot\n\n**Não é possível seguir bots!**\n\nApenas usuários reais podem ser seguidos.`
                    };
                }
                
                // Verifica se não está tentando seguir a si mesmo
                if (extractedId === userId) {
                    logMessage('VALIDATION_ERROR', username, 'SISTEMA', 'Tentativa de auto-seguimento', { 
                        userId, 
                        targetUserId: extractedId
                    });
                    
                    return {
                        valid: false,
                        error: `❌ **Auto-seguimento não permitido!**\n\nVocê não pode seguir a si mesmo.\n\n**Dica:** Use o comando para seguir outros usuários ou canais de voz.`
                    };
                }
                
                targetType = 'usuário';
                targetName = user.username;
                targetInfo = {
                    type: 'user',
                    id: extractedId,
                    username: user.username,
                    discriminator: user.discriminator
                };
                
                logMessage('VALIDATION_SUCCESS', username, 'SISTEMA', `Usuário válido encontrado: ${user.username}`, targetInfo);
            }
        } catch (userError) {
            logMessage('VALIDATION_ERROR', username, 'SISTEMA', 'ID não encontrado', { 
                userId, 
                input,
                extractedId,
                channelError: error.message,
                userError: userError.message
            });
            
            return {
                valid: false,
                error: `❌ **ID não encontrado!**\n\n**ID fornecido:** \`${extractedId}\`\n\n**O ID não corresponde a:**\n• Um canal de voz válido\n• Um usuário válido\n\n**Verificações:**\n• O ID está correto?\n• O canal/usuário existe?\n• O bot tem permissão para ver o canal?\n• O usuário não bloqueou o bot?\n\n**Como obter IDs:**\n1. Habilite o Modo Desenvolvedor\n2. Clique com botão direito no canal/usuário\n3. Selecione "Copiar ID"`
            };
        }
    }
    
    return {
        valid: true,
        targetType,
        targetName,
        targetId: extractedId,
        targetInfo
    };
}// Envia notificações para os seguidores
async function notifyFollowers(targetId, message, excludeUserId = null, channelId = null) {
    const timestamp = getFormattedTimestamp();
    const followers = followersData[targetId] || [];
    
    logMessage('NOTIFICATION_START', 'SISTEMA', 'MULTIPLOS', `Iniciando notificações para ${followers.length} seguidores`, {
        targetId,
        followersCount: followers.length,
        excludeUserId,
        channelId,
        followers: followers.slice(0, 5) // Log apenas os primeiros 5 para não poluir
    });
    
    if (followers.length === 0) {
        logMessage('NOTIFICATION_SKIP', 'SISTEMA', 'N/A', 'Nenhum seguidor encontrado', { targetId });
        return;
    }
    
    let notificationsSent = 0;
    let notificationsSkipped = 0;
    
    for (const followerId of followers) {
        try {
            // Não notifica o próprio usuário que entrou no canal
            if (excludeUserId && followerId === excludeUserId) {
                logMessage('NOTIFICATION_SKIP', 'SISTEMA', followerId, 'Pulando auto-notificação', { 
                    reason: 'Self exclusion',
                    excludeUserId 
                });
                notificationsSkipped++;
                continue;
            }
            
            // Verifica se o seguidor está no mesmo canal onde alguém entrou
            if (channelId) {
                try {
                    const followerUser = await client.users.fetch(followerId);
                    const guilds = client.guilds.cache;
                    
                    let followerInSameChannel = false;
                    let followerCurrentChannel = null;
                    
                    // Verifica em todos os servidores se o seguidor está no mesmo canal
                    for (const guild of guilds.values()) {
                        try {
                            const member = await guild.members.fetch(followerId);
                            if (member && member.voice.channelId) {
                                followerCurrentChannel = member.voice.channelId;
                                if (member.voice.channelId === channelId) {
                                    followerInSameChannel = true;
                                    break;
                                }
                            }
                        } catch (error) {
                            // Usuário não está neste servidor, continua verificando outros
                            continue;
                        }
                    }
                    
                    // Se o seguidor está no mesmo canal, não envia notificação
                    if (followerInSameChannel) {
                        logMessage('NOTIFICATION_SKIP', 'SISTEMA', followerId, 'Seguidor no mesmo canal', { 
                            reason: 'Same channel',
                            followerCurrentChannel,
                            eventChannelId: channelId,
                            username: followerUser.username
                        });
                        notificationsSkipped++;
                        continue;
                    }
                    
                } catch (error) {
                    logMessage('NOTIFICATION_WARNING', 'SISTEMA', followerId, 'Erro ao verificar localização do seguidor', { 
                        error: error.message,
                        action: 'Enviando notificação mesmo assim'
                    });
                    // Em caso de erro, continua com o envio da notificação
                }
            }
            
            // Envia a notificação
            const user = await client.users.fetch(followerId);
            await user.send(message);
            
            logMessage('NOTIFICATION_SENT', 'SISTEMA', user.username, 'DM enviada com sucesso', {
                userId: followerId,
                messagePreview: message.substring(0, 50) + '...',
                targetId
            });
            
            notificationsSent++;
            
        } catch (error) {
            logMessage('NOTIFICATION_ERROR', 'SISTEMA', followerId, 'Falha ao enviar DM', {
                error: error.message,
                errorCode: error.code,
                targetId
            });
            notificationsSkipped++;
        }
    }
    
    logMessage('NOTIFICATION_COMPLETE', 'SISTEMA', 'MULTIPLOS', 'Processo de notificação finalizado', {
        totalFollowers: followers.length,
        notificationsSent,
        notificationsSkipped,
        targetId
    });
}

// Registra os comandos slash
async function registerCommands() {
    const commands = [
        new SlashCommandBuilder()
            .setName('follow')
            .setDescription('Seguir um canal ou usuário para receber notificações')
            .addStringOption(option =>
                option.setName('user-or-channel')
                    .setDescription('ID do canal, ID do usuário ou menção (@usuario)')
                    .setRequired(true)
            ),
        
        new SlashCommandBuilder()
            .setName('following')
            .setDescription('Ver lista de canais/usuários que você está seguindo'),
        
        new SlashCommandBuilder()
            .setName('unfollow')
            .setDescription('Parar de seguir um canal ou usuário')
            .addStringOption(option =>
                option.setName('user-or-channel')
                    .setDescription('ID do canal, ID do usuário ou menção (@usuario)')
                    .setRequired(true)
            )
    ];

    try {
        logMessage('COMMANDS_REGISTER_START', 'SISTEMA', 'DISCORD', 'Iniciando registro de comandos slash', {
            commandCount: commands.length,
            commandNames: commands.map(cmd => cmd.name)
        });
        
        console.log('Registrando comandos slash...');
        await client.application.commands.set(commands);
        
        logMessage('COMMANDS_REGISTER_SUCCESS', 'SISTEMA', 'DISCORD', 'Comandos slash registrados com sucesso', {
            commandCount: commands.length,
            commandNames: commands.map(cmd => cmd.name)
        });
        
        console.log('Comandos slash registrados com sucesso!');
    } catch (error) {
        logMessage('COMMANDS_REGISTER_ERROR', 'SISTEMA', 'DISCORD', 'Erro ao registrar comandos', {
            error: error.message,
            code: error.code,
            commandCount: commands.length
        });
        
        console.error('Erro ao registrar comandos:', error);
    }
}

client.once(Events.ClientReady, async () => {
    const readyTime = getFormattedTimestamp();
    
    logMessage('BOT_READY', 'SISTEMA', 'DISCORD', 'Clansados Bot conectado com sucesso', {
        botTag: client.user.tag,
        botId: client.user.id,
        guildCount: client.guilds.cache.size,
        userCount: client.users.cache.size,
        readyTime
    });
    
    console.log(`Clansados Bot logado como ${client.user.tag}!`);
    
    await loadFollowersData();
    await registerCommands();
    
    // Inicializa o countdown se o CHANNEL_ID estiver configurado
    const countdownChannelId = process.env.CHANNEL_ID;
    if (countdownChannelId) {
        logMessage('COUNTDOWN_INIT', 'SISTEMA', 'COUNTDOWN', 'Inicializando funcionalidade de countdown', {
            channelId: countdownChannelId
        });
        
        const countdownControl = initializeCountdown(client, countdownChannelId);
        countdownControl.start();
        
        logMessage('COUNTDOWN_READY', 'SISTEMA', 'COUNTDOWN', 'Countdown ativo e agendado', {
            channelId: countdownChannelId,
            schedule: '8:00 AM UTC daily'
        });
    } else {
        logMessage('COUNTDOWN_DISABLED', 'SISTEMA', 'COUNTDOWN', 'Countdown desabilitado - CHANNEL_ID não configurado', {});
    }
    
    logMessage('BOT_INIT_COMPLETE', 'SISTEMA', 'SISTEMA', 'Inicialização completa do bot', {
        botTag: client.user.tag,
        dataLoaded: true,
        commandsRegistered: true,
        countdownEnabled: !!countdownChannelId
    });
});

// Handler para comandos slash
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'follow') {
        const targetInput = interaction.options.getString('user-or-channel');
        const userId = interaction.user.id;
        const username = interaction.user.username;
        
        logMessage('COMMAND', username, 'SISTEMA', '/follow executado', { 
            userId, 
            targetInput 
        });
        
        // Valida a entrada do usuário
        const validation = await validateUserInput(targetInput, interaction);
        
        if (!validation.valid) {
            logMessage('COMMAND_ERROR', username, 'SISTEMA', 'Validação falhou', { 
                userId, 
                targetInput,
                error: validation.error.substring(0, 100)
            });
            
            await interaction.reply({
                content: validation.error,
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        
        const { targetType, targetName, targetId, targetInfo } = validation;
        
        // Tenta adicionar o seguidor
        const added = addFollower(targetId, userId);
        await saveFollowersData();

        if (added) {
            logMessage('FOLLOW_ADDED', username, targetName, `Novo seguimento adicionado`, {
                userId,
                targetId,
                targetType,
                targetInfo
            });
            
            await interaction.reply({
                content: `✅ **Seguimento adicionado com sucesso!**\n\n**Você está seguindo:**\n• **Tipo:** ${targetType}\n• **Nome:** ${targetName}\n• **ID:** \`${targetId}\`\n\n📬 Você receberá notificações via DM quando alguém entrar!`,
                flags: MessageFlags.Ephemeral
            });
        } else {
            logMessage('FOLLOW_DUPLICATE', username, targetName, `Tentativa de seguimento duplicado`, {
                userId,
                targetId,
                targetType
            });
            
            await interaction.reply({
                content: `ℹ️ **Você já está seguindo este ${targetType}!**\n\n**${targetType} atual:**\n• **Nome:** ${targetName}\n• **ID:** \`${targetId}\`\n\n💡 Use \`/following\` para ver todos os seus seguimentos.`,
                flags: MessageFlags.Ephemeral
            });
        }
    }

    else if (commandName === 'following') {
        const userId = interaction.user.id;
        const username = interaction.user.username;
        
        logMessage('COMMAND', username, 'SISTEMA', '/following executado', { userId });
        
        const following = getFollowing(userId);

        if (following.length === 0) {
            logMessage('FOLLOWING_EMPTY', username, 'SISTEMA', 'Usuário não segue ninguém', { userId });
            
            await interaction.reply({
                content: `📋 **Seus seguimentos**\n\nVocê não está seguindo nenhum canal ou usuário.\n\n💡 **Como começar:**\n• \`/follow @usuario\` - Seguir um usuário\n• \`/follow 123456789\` - Seguir um canal (use o ID)`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        logMessage('FOLLOWING_LIST', username, 'SISTEMA', `Listando ${following.length} seguimentos`, { 
            userId, 
            followingCount: following.length,
            following: following.slice(0, 3) 
        });

        let message = `📋 **Seus seguimentos (${following.length})**\n\n`;
        let channels = [];
        let users = [];
        let unknowns = [];
        
        for (const targetId of following) {
            try {
                // Tenta buscar como canal primeiro
                const channel = await client.channels.fetch(targetId).catch(() => null);
                if (channel) {
                    channels.push({
                        name: channel.name,
                        id: targetId,
                        type: channel.type === 2 ? 'Voz' : 'Outro'
                    });
                } else {
                    // Se não for canal, tenta como usuário
                    const user = await client.users.fetch(targetId).catch(() => null);
                    if (user) {
                        users.push({
                            name: user.username,
                            id: targetId,
                            bot: user.bot ? ' 🤖' : ''
                        });
                    } else {
                        unknowns.push(targetId);
                    }
                }
            } catch (error) {
                unknowns.push(targetId);
                logMessage('FOLLOWING_ERROR', username, 'SISTEMA', 'Erro ao buscar informações do seguimento', {
                    userId,
                    targetId,
                    error: error.message
                });
            }
        }
        
        // Adiciona canais à mensagem
        if (channels.length > 0) {
            message += `� **Canais de Voz (${channels.length}):**\n`;
            channels.forEach(channel => {
                message += `   • **${channel.name}** \`${channel.id}\`\n`;
            });
            message += '\n';
        }
        
        // Adiciona usuários à mensagem
        if (users.length > 0) {
            message += `👤 **Usuários (${users.length}):**\n`;
            users.forEach(user => {
                message += `   • **${user.name}**${user.bot} \`${user.id}\`\n`;
            });
            message += '\n';
        }
        
        // Adiciona itens desconhecidos
        if (unknowns.length > 0) {
            message += `❓ **Não encontrados (${unknowns.length}):**\n`;
            unknowns.forEach(id => {
                message += `   • \`${id}\` (pode ter sido deletado)\n`;
            });
            message += '\n';
        }
        
        message += `💡 **Comandos úteis:**\n• \`/unfollow @usuario\` - Parar de seguir\n• \`/follow @novo_usuario\` - Seguir alguém novo`;

        await interaction.reply({
            content: message,
            flags: MessageFlags.Ephemeral
        });
    }

    else if (commandName === 'unfollow') {
        const targetInput = interaction.options.getString('user-or-channel');
        const userId = interaction.user.id;
        const username = interaction.user.username;
        
        logMessage('COMMAND', username, 'SISTEMA', '/unfollow executado', { 
            userId, 
            targetInput 
        });
        
        // Para unfollow, vamos ser menos restritivos - apenas extrair o ID
        const targetId = extractUserId(targetInput);
        
        // Verifica se o ID é válido em formato
        if (!isValidDiscordId(targetId)) {
            logMessage('COMMAND_ERROR', username, 'SISTEMA', 'ID inválido para unfollow', { 
                userId, 
                targetInput,
                extractedId: targetId
            });
            
            await interaction.reply({
                content: `❌ **ID inválido!**\n\n**Formato recebido:** \`${targetInput}\`\n**ID extraído:** \`${targetId}\`\n\n**Formatos aceitos:**\n• ID direto: \`123456789012345678\`\n• Menção: \`@usuario\``,
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        
        // Verifica se o usuário está seguindo este ID
        if (!followersData[targetId] || !followersData[targetId].includes(userId)) {
            logMessage('UNFOLLOW_NOT_FOUND', username, 'SISTEMA', 'Tentativa de unfollow de algo não seguido', {
                userId,
                targetId
            });
            
            await interaction.reply({
                content: `ℹ️ **Você não está seguindo este canal/usuário.**\n\n**ID:** \`${targetId}\`\n\n💡 Use \`/following\` para ver seus seguimentos ativos.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        
        // Tenta obter informações do target para uma mensagem mais rica
        let targetName = targetId;
        let targetType = 'item';
        
        try {
            const channel = await client.channels.fetch(targetId);
            if (channel) {
                targetName = channel.name;
                targetType = 'canal';
            }
        } catch (error) {
            try {
                const user = await client.users.fetch(targetId);
                if (user) {
                    targetName = user.username;
                    targetType = 'usuário';
                }
            } catch (userError) {
                // Mantém os valores padrão
            }
        }

        const removed = removeFollower(targetId, userId);
        await saveFollowersData();

        if (removed) {
            logMessage('UNFOLLOW_SUCCESS', username, targetName, 'Seguimento removido com sucesso', {
                userId,
                targetId,
                targetType
            });
            
            await interaction.reply({
                content: `✅ **Seguimento removido com sucesso!**\n\n**Você parou de seguir:**\n• **Tipo:** ${targetType}\n• **Nome:** ${targetName}\n• **ID:** \`${targetId}\`\n\n📪 Você não receberá mais notificações deste ${targetType}.`,
                flags: MessageFlags.Ephemeral
            });
        } else {
            logMessage('UNFOLLOW_ERROR', username, 'SISTEMA', 'Falha inesperada ao remover seguimento', {
                userId,
                targetId
            });
            
            await interaction.reply({
                content: `❌ **Erro inesperado!**\n\nNão foi possível remover o seguimento. Tente novamente.\n\n**ID:** \`${targetId}\``,
                flags: MessageFlags.Ephemeral
            });
        }
    }
});

// Monitora mudanças de voz para notificar seguidores
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    // Usuário entrou em um canal
    if (newState.channelId && !oldState.channelId) {
        const channelId = newState.channelId;
        const userId = newState.member.id;
        const user = newState.member.user;
        const channel = newState.channel;
        const guild = newState.guild;

        logMessage('VOICE_JOIN', user.username, channel.name, 'Usuário entrou em canal de voz', {
            userId,
            channelId,
            channelName: channel.name,
            guildId: guild.id,
            guildName: guild.name,
            hasChannelFollowers: !!followersData[channelId],
            hasUserFollowers: !!followersData[userId],
            channelFollowersCount: followersData[channelId]?.length || 0,
            userFollowersCount: followersData[userId]?.length || 0
        });

        // Notifica seguidores do canal
        if (followersData[channelId]) {
            const message = `🔊 **${user.displayName || user.username}** entrou no canal de voz **${channel.name}** no servidor **${guild.name}**!`;
            
            logMessage('VOICE_NOTIFY_CHANNEL', user.username, 'SEGUIDORES_CANAL', 'Iniciando notificações por entrada no canal', {
                userId,
                channelId,
                channelName: channel.name,
                followersCount: followersData[channelId].length
            });
            
            await notifyFollowers(channelId, message, userId, channelId);
        }

        // Notifica seguidores do usuário
        if (followersData[userId]) {
            const message = `👤 **${user.displayName || user.username}** entrou no canal de voz **${channel.name}** no servidor **${guild.name}**!`;
            
            logMessage('VOICE_NOTIFY_USER', user.username, 'SEGUIDORES_USUARIO', 'Iniciando notificações por usuário seguido', {
                userId,
                channelId,
                channelName: channel.name,
                followersCount: followersData[userId].length
            });
            
            await notifyFollowers(userId, message, userId, channelId);
        }
        
        // Log se não há seguidores
        if (!followersData[channelId] && !followersData[userId]) {
            logMessage('VOICE_NO_FOLLOWERS', user.username, 'N/A', 'Entrada sem seguidores', {
                userId,
                channelId,
                channelName: channel.name
            });
        }
    }
    
    // Log para outras mudanças de estado (mudança de canal, saída)
    else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        // Mudança de canal
        logMessage('VOICE_MOVE', newState.member.user.username, 'CANAL', 'Usuário mudou de canal', {
            userId: newState.member.id,
            fromChannelId: oldState.channelId,
            toChannelId: newState.channelId,
            fromChannelName: oldState.channel?.name || 'Desconhecido',
            toChannelName: newState.channel?.name || 'Desconhecido'
        });
        
        // Trata como entrada no novo canal
        const channelId = newState.channelId;
        const userId = newState.member.id;
        const user = newState.member.user;
        const channel = newState.channel;
        const guild = newState.guild;

        if (followersData[channelId] || followersData[userId]) {
            // Notifica seguidores do novo canal
            if (followersData[channelId]) {
                const message = `🔊 **${user.displayName || user.username}** entrou no canal de voz **${channel.name}** no servidor **${guild.name}**!`;
                await notifyFollowers(channelId, message, userId, channelId);
            }

            // Notifica seguidores do usuário
            if (followersData[userId]) {
                const message = `👤 **${user.displayName || user.username}** entrou no canal de voz **${channel.name}** no servidor **${guild.name}**!`;
                await notifyFollowers(userId, message, userId, channelId);
            }
        }
    }
    
    else if (oldState.channelId && !newState.channelId) {
        // Saída de canal
        logMessage('VOICE_LEAVE', oldState.member.user.username, 'CANAL', 'Usuário saiu do canal de voz', {
            userId: oldState.member.id,
            channelId: oldState.channelId,
            channelName: oldState.channel?.name || 'Desconhecido'
        });
    }
});

// Error handling
client.on(Events.Error, error => {
    logMessage('CLIENT_ERROR', 'SISTEMA', 'DISCORD', 'Erro do cliente Discord', {
        error: error.message,
        code: error.code,
        stack: error.stack?.substring(0, 200)
    });
    console.error('Erro do cliente Discord:', error);
});

client.on(Events.Warn, info => {
    logMessage('CLIENT_WARNING', 'SISTEMA', 'DISCORD', 'Aviso do cliente Discord', {
        warning: info
    });
    console.warn('Aviso do Discord:', info);
});

process.on('unhandledRejection', error => {
    logMessage('UNHANDLED_REJECTION', 'SISTEMA', 'PROCESSO', 'Promise rejeitada não tratada', {
        error: error.message,
        stack: error.stack?.substring(0, 200)
    });
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    logMessage('UNCAUGHT_EXCEPTION', 'SISTEMA', 'PROCESSO', 'Exceção não capturada', {
        error: error.message,
        stack: error.stack?.substring(0, 200)
    });
    console.error('Uncaught exception:', error);
    process.exit(1);
});

// Login do Clansados Bot
const token = process.env.DISCORD_TOKEN;
if (!token) {
    logMessage('LOGIN_ERROR', 'SISTEMA', 'PROCESSO', 'Token do Discord não encontrado', {
        envFile: '.env',
        tokenExists: false
    });
    console.error('DISCORD_TOKEN não encontrado no arquivo .env');
    process.exit(1);
}

client.login(token).then(() => {
    logMessage('LOGIN_SUCCESS', 'SISTEMA', 'DISCORD', 'Login realizado com sucesso', {
        timestamp: getFormattedTimestamp()
    });
}).catch(error => {
    logMessage('LOGIN_FAILED', 'SISTEMA', 'DISCORD', 'Falha no login', {
        error: error.message,
        code: error.code
    });
    console.error('Erro no login:', error);
    process.exit(1);
});