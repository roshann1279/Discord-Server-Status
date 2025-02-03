require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const SERVER_IP = process.env.SERVER_IP;
const SERVER_PORT = process.env.SERVER_PORT;
const SERVER_CONNECT_IP = `${SERVER_IP}:${SERVER_PORT}`;
const CHANNEL_ID = process.env.CHANNEL_ID;

let statusMessage;

// Get FiveM Server Status
async function getServerStatus() {
    try {
        const infoResponse = await axios.get(`http://${SERVER_IP}:${SERVER_PORT}/info.json`);
        const playersResponse = await axios.get(`http://${SERVER_IP}:${SERVER_PORT}/players.json`);

        return {
            online: true,
            name: infoResponse.data.vars.sv_projectName || "FiveM Server",
            players: playersResponse.data.length,
            maxPlayers: infoResponse.data.vars.sv_maxClients,
            connectIP: SERVER_CONNECT_IP
        };
    } catch (error) {
        console.error('Error fetching server status:', error.message);
        return {
            online: false,
            name: "Server Offline",
            players: 0,
            maxPlayers: 0,
            connectIP: SERVER_CONNECT_IP
        };
    }
}



function createEmbed(status) {
    const exampleEmbed = new EmbedBuilder()
        .setColor(status.online ? 0x00ff00 : 0xff0000)
        .setTitle(status.online ? '🟢 Server Status: **ONLINE**' : '🔴 Server Status: **OFFLINE**')
        .setDescription('Live Status Update')
        .setThumbnail('https://staticg.sportskeeda.com/editor/2024/04/609ed-17129406761959-1920.jpg') 
        .addFields(
            { name: '**Server Name**', value: `${status.name}`, inline: false },
            { name: '**Players Online**', value: `${status.players}/${status.maxPlayers}`, inline: false },
            { name: '**Connect IP**', value: `${status.connectIP}`, inline: false },
        )
        .setImage('https://staticg.sportskeeda.com/editor/2024/04/609ed-17129406761959-1920.jpg') 
        .setFooter({ text: 'Last updated' })
        .setTimestamp();

    return exampleEmbed;
}


async function updateStatusMessage() {
    try {
        const status = await getServerStatus();
        const embed = createEmbed(status);

        if (statusMessage) {
            await statusMessage.edit({ embeds: [embed] });
            console.log('✅ Status message updated.');
        } else {
            const channel = await client.channels.fetch(CHANNEL_ID);
            statusMessage = await channel.send({ embeds: [embed] });
            console.log('✅ Status message sent.');
        }
    } catch (error) {
        console.error('Error updating status message:', error.message);
    }
}

// Event: Bot Ready
client.once('ready', () => {
    console.log(`🚀 Logged in as ${client.user.tag}`);
    updateStatusMessage();
    setInterval(updateStatusMessage, 60000); 
});

// Manual Command to Update Status
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!serverstatus') {
        await updateStatusMessage();
        message.channel.send('✅ Server status updated!');
    }
});


client.login(process.env.DISCORD_TOKEN);