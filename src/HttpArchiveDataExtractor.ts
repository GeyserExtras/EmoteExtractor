import * as fs from 'fs';

export interface HarEntry {
    startedDateTime: string;
    time: number;
    request: {
        method: string;
        url: string;
        httpVersion: string;
        headers: Array<{ name: string; value: string }>;
        queryString: Array<{ name: string; value: string }>;
        cookies: Array<{ name: string; value: string }>;
        headersSize: number;
        bodySize: number;
    };
    response: {
        status: number;
        statusText: string;
        httpVersion: string;
        headers: Array<{ name: string; value: string }>;
        cookies: Array<{ name: string; value: string }>;
        content: {
            size: number;
            mimeType: string;
            text?: string;
        };
        redirectURL: string;
        headersSize: number;
        bodySize: number;
    };
    cache: any;
    timings: {
        blocked: number;
        dns: number;
        connect: number;
        send: number;
        wait: number;
        receive: number;
        ssl: number;
    };
    serverIPAddress: string;
    connection: string;
}

export interface HarLog {
    version: string;
    creator: {
        name: string;
        version: string;
    };
    entries: HarEntry[];
}

export interface HarFile {
    log: HarLog;
}

export default class HttpArchiveDataExtractor {
    private harData: HarFile;

    constructor(filePath: string) {
        const fileContent = fs.readFileSync(filePath);
        const content = fileContent.toString("utf-8");
        const hasBOM = content.charCodeAt(0) === 0xFEFF;
        const jsonString = hasBOM ? content.slice(1) : content;
        this.harData = JSON.parse(jsonString);
    }

    public getEntries(): HarEntry[] {
        return this.harData.log.entries;
    }

    public getEntryUrls(): string[] {
        return this.harData.log.entries.map(entry => entry.request.url);
    }

    public getEntryByUrl(url: string): HarEntry | undefined {
        return this.harData.log.entries.find(entry => entry.request.url === url);
    }

    public getEntriesByUrl(url: string): HarEntry[] {
        return this.harData.log.entries.filter(entry => entry.request.url === url);
    }

    public getEntriesByHostname(hostname: string): HarEntry[] {
        return this.harData.log.entries.filter(entry => {
            try {
                const url = new URL(entry.request.url);
                return url.hostname === hostname;
            } catch (e) {
                return false;
            }
        });
    }
}
