require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActivityType, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const prefix = "^";
const botMention = "<@1110342163516096623>";
const xpDataPath = "xpData.json";
const stockDataPath = "stocks.json";
const economyDataPath = "economy.json";
const xpConfigPath = path.resolve("/root/khalon-bot/config/xp.yml");
const transactionLogPath = "transactions.log";
const restartChannelId = "1345821181198209184";
const embedColor = "#8a4970";
const currencyName = "Khal";
const currencyEmoji = "<:khal:1346008227879321651>";
const botOwners = ["448896936481652777", "693961222294470758"];

let xpData = {};
let stockData = {};
let economyData = {};
let xpConfig = {};

function logTransaction(logMessage) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(transactionLogPath, `[${timestamp}] ${logMessage}\n`);
}

function loadConfig() {
    if (fs.existsSync(xpConfigPath)) {
        try {
            xpConfig = yaml.load(fs.readFileSync(xpConfigPath, "utf8"));
            console.log("✅ XP Config Loaded Successfully.");
        } catch (error) {
            console.error("❌ Error parsing xp.yml:", error);
            process.exit(1);
        }
    } else {
        console.error(`❌ Error: xp.yml file not found at: ${xpConfigPath}`);
        process.exit(1);
    }
}

function loadJSONData(filePath, defaultValue = {}) {
    try {
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, "utf8").trim();
            return fileContent ? JSON.parse(fileContent) : defaultValue;
        } else {
            fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
            return defaultValue;
        }
    } catch (error) {
        console.error(`❌ Error loading JSON file (${filePath}):`, error);
        return defaultValue; // Prevent bot crash by returning default values
    }
}

xpData = loadJSONData(xpDataPath);
stockData = loadJSONData(stockDataPath);
economyData = loadJSONData(economyDataPath);

loadConfig();

client.once("ready", async () => {
    console.log("✅ Khalon is online!");
    try {
        const channel = await client.channels.fetch(restartChannelId);
        if (channel && channel.permissionsFor(client.user).has(PermissionsBitField.Flags.SendMessages)) {
            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle("<:khal:1346008227879321651> 𝐊𝐡𝐚𝐥𝐨𝐧 is back online!")
                .setDescription("The bot has restarted successfully.");
            channel.send({ embeds: [embed] });
        } else {
            console.warn("⚠️ Bot does not have permission to send messages in the restart channel.");
        }
    } catch (error) {
        console.error(`❌ Error fetching restart channel: ${error.message}`);
    }
});

function handleGiveCurrency(message, args) {
    const recipient = message.mentions.users.first();
    const amount = parseInt(args[1], 10);

    if (!recipient || isNaN(amount) || amount <= 0) {
        return message.reply(`❌ Invalid usage! Example: **^give @User 100 ${currencyName} ${currencyEmoji}**`);
    }

    if (!economyData[message.author.id]) {
        economyData[message.author.id] = { balance: 0 };
    }

    if (!economyData[recipient.id]) {
        economyData[recipient.id] = { balance: 0 };
    }

    if (economyData[message.author.id].balance < amount) {
        return message.reply(`❌ You don't have enough ${currencyName} ${currencyEmoji} to send.`);
    }

    economyData[message.author.id].balance -= amount;
    economyData[recipient.id].balance += amount;
    fs.writeFileSync(economyDataPath, JSON.stringify(economyData, null, 2));
    logTransaction(`${message.author.username} (${message.author.id}) sent ${amount} ${currencyName} to ${recipient.username} (${recipient.id})`);

    return message.channel.send(`✅ **${message.author.username}** has sent **${amount} ${currencyName} ${currencyEmoji}** to **${recipient.username}**!`);
}

client.on("messageCreate", async (message) => {
    if (message.author.bot || (!message.content.startsWith(prefix) && !message.content.startsWith(botMention))) return;
    
    const args = message.content.replace(botMention, "").trim().slice(prefix.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();

    switch (command) {
        case "help":
            return message.channel.send({ embeds: [generateHelpEmbed()] });
        case "balance":
        case "bal":
            return message.channel.send(`💰 Your balance: **${economyData[message.author.id]?.balance || 0} ${currencyName} ${currencyEmoji}**`);
        case "give":
            return handleGiveCurrency(message, args);
        case "leaderboard":
            return message.channel.send("🏆 Leaderboard feature coming soon!");
        case "restart":
            if (!botOwners.includes(message.author.id)) {
                return message.reply("❌ You do not have permission to restart the bot.");
            }
            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle("🔄 Restarting Khalon...")
                .setDescription("The bot is restarting now.");
            await message.channel.send({ embeds: [embed] });
            console.log("♻️ Restart command triggered by bot owner. Exiting process...");
            process.exit(1);
            break;
        case "addstock":
            return handleAddStock(message, args);
        case "viewstocks":
        case "stocks":
            return handleViewStocks(message);
        default:
            return message.reply("⚠️ Unknown command. Use `^help` to see available commands.");
    }
});

console.log("🎯 Final checks completed. Bot ready to deploy.");
client.login(process.env.BOT_TOKEN);
