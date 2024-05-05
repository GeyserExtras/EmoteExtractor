const fs = require('node:fs');
const path = require('node:path');
const mcPersonaPath = "Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/premium_cache/persona";
const personaCache = path.resolve(process.env.LOCALAPPDATA, mcPersonaPath);
let emotes = [];
emotes.push({
    "name": "Follow",
    "uuid": "17428c4c-3813-4ea1-b3a9-d6a32f83afca",
    "message": "@ is asking everyone to &Follow& along.",
    "specialmessage": "@: Llama train, rolling out! (&Follow&)"
  });
  emotes.push({
    "name": "Clapping",
    "uuid": "9a469a61-c83b-4ba9-b507-bdbe64430582",
    "message": "@ is &Clapping&.",
    "specialmessage": "@: Congratulations!"
  });
  emotes.push({
    "name": "Over There!",
    "uuid": "ce5c0300-7f03-455d-aaf1-352e4927b54d",
    "message": "@ is pointing &over there&!",
    "specialmessage": "@: This isn't working... CREEPER!"
  });
  emotes.push({
    "name": "Waving",
    "uuid": "4c8ae710-df2e-47cd-814d-cc7bf21a3d67",
    "message": "@ is &Waving&.",
    "specialmessage": "@'s arm is tired from so much Waving."
  });
fs.readdirSync(personaCache).forEach((folder) => {
    let personaItemFolder = mcPersonaPath + "/" + folder;
    let textsFolder = personaItemFolder + "/texts";
    let manifestFile = personaItemFolder + "/manifest.json";
    const langFilePath = path.resolve(process.env.LOCALAPPDATA, textsFolder+"/en_US.lang");
    const manifestPath = path.resolve(process.env.LOCALAPPDATA, manifestFile);
    let manifest = JSON.parse(fs.readFileSync(manifestPath,'utf8'));
    let langFile = fs.readFileSync(langFilePath,'utf8').split("\n");
    langFile.forEach((s, i)=>{
        langFile[i] = s.replace("\r","");
    });
    let emoteUUID = manifest.header.uuid;
    if (langFile.length >= 2 && langFile[0].startsWith("persona.offer.title") && langFile[1].startsWith("persona.emote.chat_message")){
       let emoteName = langFile[0].replace("persona.offer.title=","");
       let emoteMessage = langFile[1].replace("persona.emote.chat_message=","");
       let emoteEasterEggMessage = "";
       if (langFile.length >= 3 && langFile[2].startsWith("persona.emote.easter_egg")){
            emoteEasterEggMessage = langFile[2].replace("persona.emote.easter_egg=","");
       }
       let emoteData = {"name":emoteName,"uuid":emoteUUID,"message":emoteMessage,"specialmessage":emoteEasterEggMessage};
       emotes.push(emoteData);
       console.log(`Found emote: '${emoteName}' with ID '${emoteUUID}'`);
    }
});
fs.writeFile("emotes.json",JSON.stringify(emotes),()=>{
    console.log(`Completed with ${emotes.length} emotes!`);
});