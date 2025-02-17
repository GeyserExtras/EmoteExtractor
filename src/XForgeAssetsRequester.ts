
import https from 'node:https';
import { IncomingMessage } from 'node:http';
export class XForgeAssetsRequester {
    public static makeRequest(url: string, callback: (data: Uint8Array) => void) {
        const headers = {
            'Accept': '*/*',
            'User-Agent': 'libhttpclient/1.0.0.0',
            'Accept-Language': 'en-AU,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Host': 'xforgeassets002.xboxlive.com',
            'Connection': 'Keep-Alive'
        };
    
        const options = {
            method: 'GET',
            headers: headers
        };
        https.request(url, options, (res: IncomingMessage) => {
            const chunks: Uint8Array[] = [];
            res.on('data', (chunk: Uint8Array) => {
                chunks.push(chunk);
            });
            res.on('end', () => {
                const uint8Array = new Uint8Array(Buffer.concat(chunks));
                callback(uint8Array);
            });
        }).end();
    }
}