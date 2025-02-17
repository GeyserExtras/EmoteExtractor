import { Emote } from "./Emote";
import EmoteExtractor from "./EmoteExtractor";
import HttpArchiveDataExtractor from "./HttpArchiveDataExtractor";
const extractor = new HttpArchiveDataExtractor('httparchive.har');

// TODO: language detection using headers
// TODO: add message and special message to emotes
extractor.getEntriesByHostname("store-secondary.mktpl.minecraft-services.net").forEach(entry => {
    try {
        if (entry.request.url.includes("pages/DressingRoom_Emotes")) {
            JSON.parse(entry.response.content.text + "").result.rows.forEach((row: any) => {
                if (row.controlId == "GridList"){
                    row.components.forEach((component: any) => {
                        if (Object.keys(component).includes("items")){
                            component.items.forEach((item: any) => {
                               parseMarketplaceData(item);
                            });
                        }
                    });
                }
            });
        }
    } catch (error) {
        // Ignore invalid JSON
    }
});
extractor.getEntriesByHostname("store-secondary.mktpl.minecraft-services.net").forEach(entry => {
    try {
        if (entry.request.url.includes("layout/items")) {
            JSON.parse(entry.response.content.text+"").result.forEach((item: any) => {
                parseMarketplaceData(item);
            });
        }
    } catch (error) {
        // Ignore invalid JSON
    }
});

function parseMarketplaceData(item: any) {
    let uuid: String;
    let emote: Emote = {
        name: "",
        message: undefined,
        specialmessage: undefined,
        creator: undefined,
        thumbnail: undefined,
        price: undefined,
        rarity: undefined
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
        //console.log(item);
        console.log(uuid + ": " + JSON.stringify(emote));
    }

}
//EmoteExtractor.start();