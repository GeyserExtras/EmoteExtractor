import fs from 'node:fs';
import path from 'node:path';
import { Emote } from './Emote';
import EmoteExtractor from './EmoteExtractor';
export default class PersonaMessageExtractor {
    static mcPersonaPath = "Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/premium_cache/persona";
    static LOCALAPPDATA = "";
    static read() {
        if (process.env.LOCALAPPDATA != undefined) {
            this.LOCALAPPDATA = process.env.LOCALAPPDATA;
        };
        fs.readdirSync(path.resolve(this.LOCALAPPDATA, PersonaMessageExtractor.mcPersonaPath)).forEach((folder) => {
            this.readFolder(folder);
        });
    }

    static readFolder(folder: fs.PathLike) {
        let emote: Emote = {
            name: '',
            message: '',
            specialmessage: '',
            creator: undefined,
            thumbnail: undefined,
            price: undefined,
            rarity: undefined,
            primary: undefined
        };
        let personaItemFolder = this.mcPersonaPath + "/" + folder;
        let manifest = JSON.parse(fs.readFileSync(path.resolve(this.LOCALAPPDATA, personaItemFolder + "/manifest.json"), 'utf8'));

        for (let langNum in EmoteExtractor.LANGUAGES) {
            let langID: string = EmoteExtractor.LANGUAGES[langNum];
            let langPath = personaItemFolder + "/texts/" + langID + ".lang";
            langPath = path.resolve(this.LOCALAPPDATA, langPath);
            if (!fs.existsSync(langPath)) {
                continue;
            }
            let langFile = fs.readFileSync(langPath, 'utf8').split("\n");
            langFile.forEach((s, i) => {
                langFile[i] = s.replace("\r", "");
            });
            if (langFile.length >= 2 && langFile[0].startsWith("persona.offer.title") && langFile[1].startsWith("persona.emote.chat_message")) {
                emote.name = langFile[0].replace("persona.offer.title=", "");
                emote.message = langFile[1].replace("persona.emote.chat_message=", "");
                let emoteEasterEggMessage = "";
                if (langFile.length >= 3 && langFile[2].startsWith("persona.emote.easter_egg")) {
                    emoteEasterEggMessage = langFile[2].replace("persona.emote.easter_egg=", "");
                }
                emote.specialmessage = emoteEasterEggMessage;
                EmoteExtractor.tryAddEmote(manifest.header.uuid, emote, langID);
            }
        }
    }
}