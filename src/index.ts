import fs from 'node:fs';
import path from 'node:path';
import { Emote } from './Emote';
const mcPersonaPath = "Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/premium_cache/persona";
let LOCALAPPDATA = "";
if (process.env.LOCALAPPDATA != undefined) {
  LOCALAPPDATA = process.env.LOCALAPPDATA;
};
const personaCache = path.resolve(LOCALAPPDATA, mcPersonaPath);
const LANGUAGES: Array<string> = [
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
let logHistory: string = "";

let emotes: Map<string, Map<string, Emote>> = new Map<string, Map<string, Emote>>();
let emotesprevsize: Map<string, number> = new Map<string, number>();
LANGUAGES.forEach((lang) => {
  emotesprevsize.set(lang, 0);
  if (fs.existsSync(`emotes/${lang}.json`)) {
    let map = new Map<string, Emote>();
    let obj = JSON.parse(fs.readFileSync(`emotes/${lang}.json`, 'utf8'));
    Object.keys(obj).forEach(((uuid) => {
      map.set(uuid, obj[uuid] as Emote)
    }))

    emotes.set(lang, map);
    emotesprevsize.set(lang, map.size);
  }
  else {
    emotes.set(lang, new Map<string, Emote>());
  }
});
addEnglishDefaults("en_US")
addEnglishDefaults("en_GB")

fs.readdirSync(personaCache).forEach((folder) => {
  readFolder(folder);
});
saveEmotes();

function saveEmotes() {
  let newDataFound = false;
  if (!fs.existsSync(`emotes/`)) {
    fs.mkdirSync(`emotes/`);
  }
  let totalsize: number = 0;
  let newEmotesFound: number = 0;
  emotes.forEach((map, lang) => {
    totalsize += map.size;
    if (map.size != 0) {
      let jsonObj: any = {};
      map.forEach((data, uuid) => {
        jsonObj[uuid] = data;
      })
      fs.writeFileSync(`emotes/${lang}.json`, JSON.stringify(jsonObj));
      let lastSize = emotesprevsize.get(lang);
      if (lastSize != undefined && map.size - lastSize != 0) {
        log(`Saved ${lang} with ${map.size - lastSize} added emotes! Size: ${map.size}`);
        newEmotesFound += map.size - lastSize;
        newDataFound = true;
      }
      else {
        log(`No new added emotes to ${lang}! Size: ${lastSize}`);
      }
    }
    else {
      log(`No emotes in ${lang}!`);
    }
  });
  log("Amount of emote data saved across all languages: " + totalsize);
  if (newDataFound){
    log(`~~~~~~~~~ɢᴇʏsᴇʀᴇxᴛʀᴀs ᴇᴍᴏᴛᴇᴇxᴛʀᴀᴄᴛᴏʀ~~~~~~~~~`)
    log(`${newEmotesFound} new emote texts were found and successfully added! Please contribute by making a PR with your new data.`)
    log(`https://github.com/GeyserExtras/EmoteExtractor`)
    log(`~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`)
  }
  wait();
}

function delay(time:number) {
  return new Promise(resolve => setTimeout(resolve, time));
}

async function wait() {
  if (!fs.existsSync(`logs/`)) {
    fs.mkdirSync(`logs/`);
  }
  fs.writeFileSync(`logs/`+Date.now()+".log", logHistory);
  log('Closing in 30 seconds...');
  await delay(30000);
}

function readFolder(folder: fs.PathLike) {
  let emote: Emote = {
    name: '',
    message: '',
    specialmessage: ''
  };
  let personaItemFolder = mcPersonaPath + "/" + folder;
  let manifest = JSON.parse(fs.readFileSync(path.resolve(LOCALAPPDATA, personaItemFolder + "/manifest.json"), 'utf8'));

  for (let langNum in LANGUAGES) {
    let langID: string = LANGUAGES[langNum];
    let langPath = personaItemFolder + "/texts/" + langID + ".lang";
    langPath = path.resolve(LOCALAPPDATA, langPath);
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
      tryAddEmote(manifest.header.uuid, emote, langID);
    }
  }
}

function addEnglishDefaults(lang: string) {
  tryAddEmote("17428c4c-3813-4ea1-b3a9-d6a32f83afca", {
    name: "Follow",
    message: "@ is asking everyone to &Follow& along.",
    specialmessage: "@: Llama train, rolling out! (&Follow&)"
  }, lang);
  tryAddEmote("9a469a61-c83b-4ba9-b507-bdbe64430582", {
    name: "Clapping",
    message: "@ is &Clapping&.",
    specialmessage: "@: Congratulations!"
  }, lang);
  tryAddEmote("ce5c0300-7f03-455d-aaf1-352e4927b54d", {
    name: "Over There!",
    message: "@ is pointing &over there&!",
    specialmessage: "@: This isn't working... CREEPER!"
  }, lang);
  tryAddEmote("4c8ae710-df2e-47cd-814d-cc7bf21a3d67", {
    name: "Waving",
    message: "@ is &Waving&.",
    specialmessage: "@'s arm is tired from so much Waving."
  }, lang);
}

function tryAddEmote(uuid: string, emote: Emote, lang: string) {
  if (emotes.get(lang)?.has(uuid)) {
    return;
  }
  emotes.get(lang)?.set(uuid, emote);
  log(`Added emote: '${emote.name}' with ID '${uuid} in lang ${lang}!`);
}

function log(text:String){
  console.log(text);
  logHistory += text+"\n";
}