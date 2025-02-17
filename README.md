# EmoteExtractor
A simple node application that extracts all the emote metadata from the persona cache in Minecraft: Bedrock Edition on Windows.

This repository also contains a public list of emote data under `emotes/` which can be used for what ever purpose you would like.

## Helping contribute
If you have Minecraft: Bedrock Edition and are experienced with how to make PR's on GitHub, please run this program if you can.

It will automatically append all new emote data and translations you have on your device to the JSON files in the repository, and will help make it available for all plugins to use.

### Using node.js
Run `npx tsc` to build, then run `node build/index.js` to run.

### Using a HAR file to rip data
todo 

If the console prints out `## new emote texts were found and successfully added! Please contribute by making a PR with your new data.` then new data was found!