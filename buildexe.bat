@ECHO off
del EmoteExtractor.exe
del sea-prep.blob
node --experimental-sea-config sea-config.json 
node -e "require('fs').copyFileSync(process.execPath, 'EmoteExtractor.exe')"
npx postject EmoteExtractor.exe NODE_SEA_BLOB sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2