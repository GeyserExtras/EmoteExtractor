import fs from 'node:fs';
import path from 'node:path';
import { Emote } from './Emote';
import PersonaMessageExtractor from './PersonaMessageExtractor';

export default class EmoteExtractor {
    static logHistory: string = "";
    static emotes: Map<string, Map<string, Emote>> = new Map<string, Map<string, Emote>>();
    static emotesprevsize: Map<string, number> = new Map<string, number>();
    public static LANGUAGES: Array<string> = [
        "en_US",
        "en_GB",
        "de_DE",
        "es_ES",
        "es_MX",
        "fr_FR",
        "fr_CA",
        "it_IT",
        "ja_JP",
        "ko_KR",
        "pt_BR",
        "pt_PT",
        "ru_RU",
        "zh_CN",
        "zh_TW",
        "nl_NL",
        "bg_BG",
        "cs_CZ",
        "da_DK",
        "el_GR",
        "fi_FI",
        "hu_HU",
        "id_ID",
        "nb_NO",
        "pl_PL",
        "sk_SK",
        "sv_SE",
        "tr_TR",
        "uk_UA"
    ];
    public static start() {
        this.LANGUAGES.forEach((lang) => {
            this.emotesprevsize.set(lang, 0);
            if (fs.existsSync(`emotes/${lang}.json`)) {
                let map = new Map<string, Emote>();
                let obj = JSON.parse(fs.readFileSync(`emotes/${lang}.json`, 'utf8'));
                Object.keys(obj).forEach(((uuid) => {
                    map.set(uuid, obj[uuid] as Emote)
                }))

                this.emotes.set(lang, map);
                this.emotesprevsize.set(lang, map.size);
            }
            else {
                this.emotes.set(lang, new Map<string, Emote>());
            }
        });
        this.addEnglishDefaults("en_US")
        this.addEnglishDefaults("en_GB")
        PersonaMessageExtractor.read();
        this.saveEmotes();
    }
    static saveEmotes() {
        let newDataFound = false;
        if (!fs.existsSync(`emotes/`)) {
            fs.mkdirSync(`emotes/`);
        }
        let totalsize: number = 0;
        let newEmotesFound: number = 0;
        EmoteExtractor.emotes.forEach((map, lang) => {
            totalsize += map.size;
            if (map.size != 0) {
                let jsonObj: any = {};
                map.forEach((data, uuid) => {
                    jsonObj[uuid] = data;
                })
                fs.writeFileSync(`emotes/${lang}.json`, JSON.stringify(jsonObj));
                let lastSize = EmoteExtractor.emotesprevsize.get(lang);
                if (lastSize != undefined && map.size - lastSize != 0) {
                    this.log(`Saved ${lang} with ${map.size - lastSize} added emotes! Size: ${map.size}`);
                    newEmotesFound += map.size - lastSize;
                    newDataFound = true;
                }
                else {
                    this.log(`No new added emotes to ${lang}! Size: ${lastSize}`);
                }
            }
            else {
                this.log(`No emotes in ${lang}!`);
            }
        });
        this.log("Amount of emote data saved across all languages: " + totalsize);
        if (newDataFound) {
            this.log(`~~~~~~~~~ɢᴇʏsᴇʀᴇxᴛʀᴀs ᴇᴍᴏᴛᴇᴇxᴛʀᴀᴄᴛᴏʀ~~~~~~~~~`)
            this.log(`${newEmotesFound} new emote texts were found and successfully added! Please contribute by making a PR with your new data.`)
            this.log(`https://github.com/GeyserExtras/EmoteExtractor`)
            this.log(`~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`)
        }
        this.wait();
    }

    static delay(time: number) {
        return new Promise(resolve => setTimeout(resolve, time));
    }

    static async wait() {
        if (!fs.existsSync(`logs/`)) {
            fs.mkdirSync(`logs/`);
        }
        fs.writeFileSync(`logs/` + Date.now() + ".log", EmoteExtractor.logHistory);
        this.log('Closing in 30 seconds...');
        await this.delay(30000);
    }

    static addEnglishDefaults(lang: string) {
        this.tryAddEmote("17428c4c-3813-4ea1-b3a9-d6a32f83afca", {
            name: "Follow",
            message: "@ is asking everyone to &Follow& along.",
            specialmessage: "@: Llama train, rolling out! (&Follow&)",
            creator: "Minecraft",
            thumbnail: undefined,
            price: 0,
            rarity: "common"
        }, lang);
        this.tryAddEmote("9a469a61-c83b-4ba9-b507-bdbe64430582", {
            name: "Clapping",
            message: "@ is &Clapping&.",
            specialmessage: "@: Congratulations!",
            creator: "Minecraft",
            thumbnail: undefined,
            price: 0,
            rarity: "common"
        }, lang);
        this.tryAddEmote("ce5c0300-7f03-455d-aaf1-352e4927b54d", {
            name: "Over There!",
            message: "@ is pointing &over there&!",
            specialmessage: "@: This isn't working... CREEPER!",
            creator: "Minecraft",
            thumbnail: undefined,
            price: 0,
            rarity: "common"
        }, lang);
        this.tryAddEmote("4c8ae710-df2e-47cd-814d-cc7bf21a3d67", {
            name: "Waving",
            message: "@ is &Waving&.",
            specialmessage: "@'s arm is tired from so much Waving.",
            creator: "Minecraft",
            thumbnail: undefined,
            price: 0,
            rarity: "common"
        }, lang);
    }

    static tryAddEmote(uuid: string, emote: Emote, lang: string) {
        let oldLang = EmoteExtractor.emotes.get(lang);
        if (oldLang instanceof Map) {
            let old = oldLang.get(uuid);
            if (old != undefined) {
                EmoteExtractor.emotes.get(lang)?.set(uuid, this.mergeEmoteData(old, emote, lang));
                return;
            }
            EmoteExtractor.emotes.get(lang)?.set(uuid, emote);
            this.log(`Added emote: '${emote.name}' with ID '${uuid} in lang ${lang}!`);
        }
    }

    static mergeEmoteData(old: Emote, new0: Emote, lang: string) {
        let mergedEmote: Emote = {
            name: '',
            message: undefined,
            specialmessage: undefined,
            creator: undefined,
            thumbnail: undefined,
            price: undefined,
            rarity: undefined
        };
        mergedEmote.name = new0.name;
        mergedEmote.message = new0.message != undefined ? new0.message : old.message;
        mergedEmote.specialmessage = new0.specialmessage != undefined ? new0.specialmessage : old.specialmessage;
        mergedEmote.creator = new0.creator != undefined ? new0.creator : old.creator;
        mergedEmote.thumbnail = new0.thumbnail != undefined ? new0.thumbnail : old.thumbnail;
        mergedEmote.price = new0.price != undefined ? new0.price : old.price;
        mergedEmote.rarity = new0.rarity != undefined ? new0.rarity : old.rarity;
        return mergedEmote;
    }

    static log(text: String) {
        console.log(text);
        EmoteExtractor.logHistory += text + "\n";
    }
}