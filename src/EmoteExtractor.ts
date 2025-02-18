import fs from 'node:fs';
import path, { parse } from 'node:path';
import { Emote } from './Emote';
import PersonaMessageExtractor from './PersonaMessageExtractor';
import HttpArchiveDataExtractor from './HttpArchiveDataExtractor';

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
        PersonaMessageExtractor.read();
        this.readHar();
        this.saveEmotes();
    }


    static readHar() {
        if (!fs.existsSync('httparchive.har')) {
            console.warn("Note: You can provide a httparchive.har file to get more emote data.");
            return;
        }
        const extractor = new HttpArchiveDataExtractor('httparchive.har');
        extractor.getEntriesByHostname("store-secondary.mktpl.minecraft-services.net").forEach(entry => {
            try {
                if (entry.request.url.includes("pages/DressingRoom_Emotes")) {
                    JSON.parse(entry.response.content.text + "").result.rows.forEach((row: any) => {
                        if (row.controlId == "GridList") {
                            row.components.forEach((component: any) => {
                                if (Object.keys(component).includes("items")) {
                                    component.items.forEach((item: any) => {
                                        parseMarketplaceData(item);
                                    });
                                }
                            });
                        }
                    });
                }
            } catch (error) {
                // Ignore invalid JSON or if the entry is not a JSON file
            }
        });
        extractor.getEntriesByHostname("store-secondary.mktpl.minecraft-services.net").forEach(entry => {
            try {
                if (entry.request.url.includes("layout/items")) {
                    JSON.parse(entry.response.content.text + "").result.forEach((item: any) => {
                        parseMarketplaceData(item);
                    });
                }
            } catch (error) {
                // Ignore invalid JSON or if the entry is not a JSON file
            }
        });

        extractor.getEntriesByHostname("20ca2.playfabapi.com").forEach(entry => {
            try {
                if (entry.request.url.includes("Catalog/GetPublishedItem")) {
                    parsePlayfabData(JSON.parse(entry.response.content.text + ""));
                }
            } catch (error) {
                // Ignore invalid JSON or if the entry is not a JSON file
            }
        });

        function parseMarketplaceData(item: any) {
            let uuid: string;
            let emote: Emote = {
                name: "",
                message: undefined,
                specialmessage: undefined,
                creator: undefined,
                thumbnail: undefined,
                price: undefined,
                rarity: undefined,
                primary: undefined
            };
            if (item.pieceType == "persona_emote") {
                uuid = item.packIdentity[0].uuid;
                emote.name = item.title;
                emote.creator = item.creatorName;
                if (item.images[0].type == "Thumbnail") {
                    emote.thumbnail = item.images[0].url;
                }
                emote.price = item.price.listPrice;
                emote.rarity = item.rarity;
                EmoteExtractor.tryAddEmote(uuid, emote, "en_US");
            }
        }

        function parsePlayfabData(item: any) {
            let uuid: string;
            let emote: Emote = {
                name: "",
                message: undefined,
                specialmessage: undefined,
                creator: undefined,
                thumbnail: undefined,
                price: undefined,
                rarity: undefined,
                primary: undefined
            };
            if (item.code == 200 && item.status == "OK") {
                let DisplayProperties = item.data.Item.DisplayProperties;
                if (DisplayProperties.pieceType == "persona_emote"){
                    uuid = DisplayProperties.packIdentity[0].uuid;
                    emote.name = item.data.Item.Title.neutral;
                    emote.creator = DisplayProperties.creatorName;
                    if (item.data.Item.Images[0].Type == "Thumbnail") {
                        emote.thumbnail = item.data.Item.Images[0].Url;
                    }
                    emote.price = DisplayProperties.price;
                    emote.rarity = DisplayProperties.rarity;
                    if (item.data.Item.Contents[0].Type == "personabinary") {
                        emote.primary = item.data.Item.Contents[0].Url;
                    }
                    EmoteExtractor.tryAddEmote(uuid, emote, "en_US");
                }
            }
        }
    }

    static saveEmotes() {
        let newDataFound = false;
        if (!fs.existsSync(`emotes/`)) {
            fs.mkdirSync(`emotes/`);
        }
        let totalsize: number = 0;
        let newEmotesFound: number = 0;
        let extendedDetails:number = 0;
        let emotesWithDownload:number = 0;

        EmoteExtractor.emotes.forEach((map, lang) => {
            totalsize += map.size;
            if (map.size != 0) {
                let jsonObj: any = {};

                map.forEach((data, uuid) => {
                    jsonObj[uuid] = data;
                    if (data.thumbnail != undefined) {
                        extendedDetails++;
                    }
                    if (data.primary != undefined) {
                        emotesWithDownload++;
                    }
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
        this.log("Amount of emote data with extended details (thumbnails, price, creator): " + extendedDetails + `(${extendedDetails/totalsize*100}%)`);
        this.log("Amount of emote data with download links (primary.zip): " + emotesWithDownload + `(${emotesWithDownload/totalsize*100}%)`);

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
            rarity: "common",
            primary: undefined
        }, lang);
        this.tryAddEmote("9a469a61-c83b-4ba9-b507-bdbe64430582", {
            name: "Clapping",
            message: "@ is &Clapping&.",
            specialmessage: "@: Congratulations!",
            creator: "Minecraft",
            thumbnail: undefined,
            price: 0,
            rarity: "common",
            primary: undefined
        }, lang);
        this.tryAddEmote("ce5c0300-7f03-455d-aaf1-352e4927b54d", {
            name: "Over There!",
            message: "@ is pointing &over there&!",
            specialmessage: "@: This isn't working... CREEPER!",
            creator: "Minecraft",
            thumbnail: undefined,
            price: 0,
            rarity: "common",
            primary: undefined
        }, lang);
        this.tryAddEmote("4c8ae710-df2e-47cd-814d-cc7bf21a3d67", {
            name: "Waving",
            message: "@ is &Waving&.",
            specialmessage: "@'s arm is tired from so much Waving.",
            creator: "Minecraft",
            thumbnail: undefined,
            price: 0,
            rarity: "common",
            primary: undefined
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
            rarity: undefined,
            primary: undefined
        };
        mergedEmote.name = new0.name;
        mergedEmote.message = new0.message != undefined ? new0.message : old.message;
        mergedEmote.specialmessage = new0.specialmessage != undefined ? new0.specialmessage : old.specialmessage;
        mergedEmote.creator = new0.creator != undefined ? new0.creator : old.creator;
        mergedEmote.thumbnail = new0.thumbnail != undefined ? new0.thumbnail : old.thumbnail;
        mergedEmote.price = new0.price != undefined ? new0.price : old.price;
        mergedEmote.rarity = new0.rarity != undefined ? new0.rarity : old.rarity;
        mergedEmote.primary = new0.primary != undefined ? new0.primary : old.primary;
        return mergedEmote;
    }

    static log(text: String) {
        console.log(text);
        EmoteExtractor.logHistory += text + "\n";
    }
}