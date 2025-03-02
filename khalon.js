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
const xpConfigPath = path.resolve("/root/velvet/xp.yml");
const restartChannelId = "1345529401218961460";
const embedColor = "#8a4970";

let xpData = {};
let stockData = {};
let economyData = {};
let xpConfig = {};

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
    if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } else {
        fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
        return defaultValue;
    }
}

xpData = loadJSONData(xpDataPath);
stockData = loadJSONData(stockDataPath);
economyData = loadJSONData(economyDataPath);

loadConfig();

client.once("ready", async () => {
    console.log("✅ Velvet Reaper is online!");
    const channel = await client.channels.fetch(restartChannelId);
    if (channel) {
        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle("<:gem3:962788778806767736> 𝐕𝐞𝐥𝐯𝐞𝐭 𝐑𝐞𝐚𝐩𝐞𝐫 is back online!")
            .setDescription("The bot has restarted successfully.");
        channel.send({ embeds: [embed] });
    }
});

client.on("messageCreate", async (message) => {
    if (message.author.bot || (!message.content.startsWith(prefix) && !message.content.startsWith(botMention))) return;
    
    const args = message.content.replace(botMention, "").trim().slice(prefix.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();

    switch (command) {
        case "quiz":
            return message.channel.send("This feature is under construction.");
        
        case "setstatus":
            if (args.length === 0) return message.reply("Usage: `^setstatus <status>`");
            client.user.setActivity(args.join(" "), { type: ActivityType.Playing });
            return message.channel.send("✅ Status updated.");
        
        case "cmds":
        case "help":
            return message.channel.send({ embeds: [generateHelpEmbed()] });
        
        case "addstock":
            return handleAddStock(message, args);
        
        case "removestock":
            return handleRemoveStock(message, args);
        
        case "stocks":
            return handleViewStocks(message);
        
        case "buystock":
            return handleBuyStock(message, args);
        
        case "sellstock":
            return handleSellStock(message, args);
        
        case "portfolio":
            return handlePortfolio(message);
        
        case "balance":
            return handleBalance(message);
        
        case "give":
            return handleGiveCurrency(message, args);
        
        case "work":
        case "crime":
            return handleEarningCommands(message, command);
        
        case "leaderboard":
            return handleLeaderboard(message);
        
        case "purge":
            return handlePurge(message, args);
        
        case "slowmode":
            return handleSlowmode(message, args);
        
        case "lock":
        case "unlock":
            return handleChannelLocking(message, command);
        
        default:
            return message.reply("⚠️ Unknown command. Use `^help` to see available commands.");
    }
});

console.log("🎯 Final checks completed. Bot ready to deploy.");
client.login(process.env.BOT_TOKEN);
