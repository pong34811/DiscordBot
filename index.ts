import { ActionRowBuilder, Client, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import config from './config';
import axios from 'axios'
import cheerio from 'cheerio'
import xml2js from 'xml2js'

const client = new Client({
    intents: [17]
});

client.on('ready', async () => {
    console.log(`Logged in as ${client.user?.tag}! ${client.user?.id}`);
    if (config.guildId && config.channelId) {
        const guild = client.guilds.cache.get(config.guildId)
        const channel = guild?.channels.cache.get(config.channelId)
        if (channel?.isTextBased()) {
            // Delete all message in channel
            await channel.bulkDelete(await channel.messages.fetch().then(messages => messages))
            // Send message
            await channel?.send({
                content: config.requestVerify.message,
                components: [{ type: 1, components: [{ type: 2, style: 1, custom_id: "verify", ...config.requestVerify.button }] }
                ]
            }).then(async (message) => {
                console.log(`Send message to channel ${channel?.id} success!`)
            }).catch(console.error)
        }
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        switch (interaction.customId) {
            case "verify":
                // interaction.deferUpdate()
                const components = []
                const modal = new ModalBuilder()
                    .setCustomId('verify')
                    .setTitle(config.form.title);

                for (const input of config.form.input) {
                    const index = config.form.input.indexOf(input)
                    const TI = new TextInputBuilder()
                        .setPlaceholder(input.placeholder)
                        .setRequired(true)
                        .setLabel(input.name)
                        .setCustomId(`verify_${index}`)
                        .setStyle(TextInputStyle.Short)
                    components.push(new ActionRowBuilder()
                        .addComponents(TI).toJSON())
                }
                modal.addComponents(components as any)
                interaction.showModal(modal)
                break;
        }
        return;
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId !== "verify") return;
        // interaction.deferUpdate()
        const error = []
        const dataInfo = new Map()
        const input_description = []
        for (const input of config.form.input) {
            const index = config.form.input.indexOf(input)
            const value = interaction.fields.getTextInputValue(`verify_${index}`)
            input_description.push(`**${input.name}**: ${value}`)
            if (input.regex) {
                if (!input.regex.test(value)) {
                    error.push(`- ${input.fail}`)
                    continue;
                }

                if (input.youtube) {
                    const channel = await channelId(value).catch(() => null)
                    if (!channel) {
                        error.push(`- ไม่พบช่อง YouTube นี้`)
                        continue;
                    }
                    const getChannelInfo = await axios({
                        url: `https://www.youtube.com/feeds/videos.xml?channel_id=${channel}`,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
                        },
                    }).then((res) => res.data).catch(() => null)
                    if (!getChannelInfo) {
                        error.push(`- ไม่พบช่อง YouTube นี้`)
                        continue;
                    }
                    const parse = await xml2js.parseStringPromise(getChannelInfo).catch(() => null)
                    if (!parse) {
                        error.push(`- ไม่พบช่อง YouTube นี้`)
                        continue;
                    }
                    dataInfo.set('channelId', channel)
                    dataInfo.set('channelName', parse.feed.author[0].name[0])
                    dataInfo.set('channelUrl', parse.feed.author[0].uri[0])
                }
            }
        }
        if (error.length > 0) {
            console.log(`${interaction.user.tag} fail to verify!`, error.join('\n'))
            await interaction.reply({ content: error.join('\n'), ephemeral: true });
            return;
        }
        const channelName = dataInfo.get('channelName')
        const channelUrl = dataInfo.get('channelUrl')
        const channelId_ = dataInfo.get('channelId')

        const guild = client.guilds.cache.get(config.guildId)
        const member = await guild?.members.fetch(interaction.user.id)
        if (!member) {
            console.log(`${interaction.user.tag} fail to verify!`, 'Unable to fetch member.')
            await interaction.reply({ content: 'Unable to fetch member.', ephemeral: true });
            return;
        }

        const roleId = config.roleIdAfterVerify
        const role = guild?.roles.cache.get(roleId)
        if (!role) {
            console.log(`${interaction.user.tag} fail to verify!`, 'Unable to fetch role.')
            await interaction.reply({ content: 'Unable to fetch role.', ephemeral: true });
            return;
        }

        await member.roles.remove(config.removeRoleAfterVerify).catch(() => null)
        await member.roles.add(role).catch(() => null)
        const channel = guild?.channels.cache.get(config.channelIdForLog)
        if (!channel?.isTextBased()) {
            console.log(`${interaction.user.tag} fail to verify!`, 'Unable to fetch channel.')
            await interaction.reply({ content: 'Unable to fetch channel.', ephemeral: true });
            return;
        }

        await channel.send({
            content: `<@${interaction.user.id}> has been verified.`,
            embeds: [{
                title: 'Verify',
                description: `${input_description.join('\n')}\nChannelName: \`${channelName}\``,
                color: 0x00ff00,
                footer: {
                    text: `ID: ${interaction.user.id}`,
                },
                thumbnail: {
                    url: interaction.user.displayAvatarURL({ forceStatic: false })
                },
                timestamp: new Date().toISOString(),
                author: {
                    name: interaction.user.username,
                    icon_url: interaction.user.displayAvatarURL({ forceStatic: false })
                }
            }]
        }).catch(() => null)
        console.log(`${interaction.user.tag} has been verified.`)
        await interaction.reply({ content: 'Verified!', ephemeral: true });
    }
});


client.login(config.token);

const checkUrl = (url: string) => url.indexOf('youtube.com') !== -1 || url.indexOf('youtu.be') !== -1
async function channelId(url: string) {
    if (checkUrl(url)) {
        const ytChannelPageResponse = await axios({
            url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36'
            },
            validateStatus: () => {
                return true
            }
        })
        // <meta itemprop="identifier" content="UCF_-M79ivR0lBcxI4VcYiWg">
        const $ = cheerio.load(ytChannelPageResponse.data)
        const id = $('meta[itemprop="identifier"]').attr('content')
        if (id) {
            return id
        }
    } else {
        throw Error(`"${url}" is not a YouTube url.`)
    }
    throw Error(`Unable to get "${url}" channel id.`)
}

process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)