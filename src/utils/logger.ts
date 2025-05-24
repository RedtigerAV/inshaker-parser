import fs from 'node:fs';
import path from 'node:path';

interface LogOptions {
    type: 'info' | 'error' | 'warning' | 'success';
    indent?: number;
}

export class Logger {
    private readonly logFilePath: string;
    private readonly typeEmoji: Record<LogOptions['type'], string> = {
        info: 'ℹ️',
        error: '❌',
        warning: '⚠️',
        success: '✅'
    };

    constructor(processName: string) {
        const timestamp = new Date().getTime();
        this.logFilePath = path.join(process.cwd(), 'logs', `${processName}.logs.${timestamp}.txt`);
    }

    public success(message: string, indent?: number): void {
        this.log(message, { type: 'success', indent });
    }

    public info(message: string, indent?: number): void {
        this.log(message, { type: 'info', indent });
    }

    public warning(message: string, indent?: number): void {
        this.log(message, { type: 'warning', indent });
    }

    public error(message: string, indent?: number): void {
        this.log(message, { type: 'error', indent });
    }

    public log(message: string, options: LogOptions = { type: 'info', indent: 0 }): void {
        try {
            const logMessage = this.getLogMessage(message, options);
            
            fs.mkdirSync(path.dirname(this.logFilePath), { recursive: true });
            fs.appendFileSync(this.logFilePath, logMessage, { encoding: 'utf-8' });
        } catch (error) {
            console.error(`Error writing to log file: ${error}`);
        }
    }

    private getLogMessage(message: string, options: LogOptions): string {
        const timestamp = new Date().toISOString();
        const indent = ' '.repeat((options.indent || 0) * 2);
        const emoji = this.typeEmoji[options.type];

        return `[${timestamp}]: ${indent}${emoji} ${message}\n`;
    }
}

export class ParserLogger extends Logger {
    public logParseResult(result: any, error: any, parsedElement: string): void {
        if (error) {
            this.error(`${parsedElement}: Parsing error`, 2);
            this.error(error.toString(), 2);
        }

        if (!error && !result) { this.warning(`${parsedElement}: No data parsed`, 2); }
        if (!error && result) { this.success(`${parsedElement}: Parsed`, 2); }
    }
}