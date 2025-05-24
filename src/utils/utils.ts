import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import axios from 'axios';
import { Config } from "../models";

export function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function delay(ms: number): Promise<void>;
export function delay(msMin: number, msMax: number): Promise<void>;
export function delay(ms: number, msMax?: number): Promise<void> {
    if (msMax && msMax < ms) {
        throw new Error('Max delay must be greater than min delay');
    }

    if (ms < 0 || (msMax && msMax < 0)) {
        throw new Error('Delay must be greater than 0');
    }

    const delayMs = msMax ? getRandomInt(ms, msMax) : ms;
    return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export async function fetchHtml(url: string): Promise<string> {
    const response = await axios.get(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Safari/605.1.15",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        }
    });

    return response.data;
}

export async function saveJSON(data: any, filename: string): Promise<void> {
    const filePath = path.join(process.cwd(), filename);
    const dir = path.dirname(filePath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export function readConfig(): Config {
    const args = process.argv.slice(2);
    const configPath = args[0].split('=')[1];
    const config = JSON.parse(fsSync.readFileSync(configPath, 'utf8'));

    return config;
}