import * as net from 'net';
import * as fs from 'fs';
import * as tls from 'tls';

interface FTPResponse {
    code: number;
    message: string;
}

class FTPSimpleManager {
    private host: string;
    private port: number;
    private username: string;
    private password: string;
    private secure: boolean;
    private socket: net.Socket;

    constructor(host: string, port: number = 21, username: string, password: string, secure: boolean = false) {
        this.host = host;
        this.port = port;
        this.username = username;
        this.password = password;
        this.secure = secure;
        this.socket = new net.Socket();
    }

    /**
     * Establishes a connection to the FTP server.
     */
    public async connect(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.secure) {
                const options: tls.ConnectionOptions = {
                    host: this.host,
                    port: this.port,
                    rejectUnauthorized: false
                };

                this.socket = tls.connect(options, () => {
                    this.socket.on('data', () => {
                        // Handle data
                    });
                    resolve();
                });

            } else {
                this.socket.connect(this.port, this.host, () => {
                    this.socket.on('data', () => {
                        // Handle data
                    });
                    resolve();
                });
            }

            this.socket.on('error', (err: Error) => {
                reject(err);
            });
        });
    }

    /**
     * Establishes a connection to the FTP server and performs login.
     */
    public async connectAndLogin(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.secure) {
                const options: tls.ConnectionOptions = {
                    host: this.host,
                    port: this.port,
                    rejectUnauthorized: false
                };

                this.socket = tls.connect(options, async () => {
                    this.socket.on('data', () => {
                        // Handle data
                    });
                    await this.login();
                    resolve();
                });

            } else {
                this.socket.connect(this.port, this.host, async () => {
                    this.socket.on('data', () => {
                        // Handle data
                    });
                    await this.login();
                    resolve();
                });
            }

            this.socket.on('error', (err: Error) => {
                reject(err);
            });
        });
    }

    /**
     * Sends an FTP command to the server.
     * @param command The FTP command to send.
     * @returns A promise that resolves to the FTP response.
     */
    private async sendCommand(command: string): Promise<FTPResponse> {
        return new Promise<FTPResponse>((resolve, reject) => {
            this.socket.write(command + '\r\n', 'utf-8', () => {
                this.socket.once('data', (data) => {
                    const response: FTPResponse = {
                        code: parseInt(data.toString().substr(0, 3)),
                        message: data.toString().substr(4).trim()
                    };
                    resolve(response);
                });
            });
        });
    }

    /**
     * Performs login to the FTP server.
     */
    public async login(): Promise<void> {
        await this.sendCommand(`USER ${this.username}`);
        await this.sendCommand(`PASS ${this.password}`);
    }

    /**
     * Retrieves the correct year for a given month and day.
     * @param month The month.
     * @param day The day.
     * @returns The correct year.
     */
    private getCorrectYear(month: number, day: number): number {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        const currentDay = new Date().getDate();
        
        if (currentMonth > month || (currentMonth === month && currentDay > day)) {
            return currentYear;
        } else {
            return currentYear - 1;
        }
    }

    /**
     * Retrieves a list of files from the FTP server.
     * @param path The path to list files from.
     * @returns A promise that resolves to an array of file objects.
     */
    public async list(path: string = '/'): Promise<{ name: string; size: number; date: Date }[]> {
        await this.sendCommand(`TYPE A`);
        const pasvResponse = await this.sendCommand('PASV');
        const pasvMatch = pasvResponse.message.match(/(\d+),(\d+),(\d+),(\d+),(\d+),(\d+)/);
        if (!pasvMatch) {
            throw new Error('Invalid PASV response.');
        }
        const dataPort = parseInt(pasvMatch[5]) * 256 + parseInt(pasvMatch[6]);
        const dataSocket = new net.Socket();
        await new Promise<void>((resolve, reject) => {
            dataSocket.connect(dataPort, `${pasvMatch[1]}.${pasvMatch[2]}.${pasvMatch[3]}.${pasvMatch[4]}`, () => {
                resolve();
            });
            dataSocket.on('error', (err: Error) => {
                reject(err);
            });
        });
        await this.sendCommand(`LIST ${path}`);
        let data = '';
        return new Promise<{ name: string; size: number; date: Date }[]>((resolve, reject) => {
            dataSocket.on('data', (chunk) => {
                data += chunk.toString();
            });
            dataSocket.on('end', () => {
                const fileList = data.split('\r\n');
                fileList.pop()
                const fileListWithYear = fileList.map((file) => {
                    const parts = file.trim().split(/\s+/);
                    const name = parts.slice(8).join(' ');
                    const size = parseInt(parts[4]);
                    const month = this.monthToNumber(parts[5]);
                    const day = parseInt(parts[6]);
                    const year = parts[7].includes(':') ? this.getCorrectYear(month, day) : parseInt(parts[7]);
                    const date = new Date(year, month - 1, day);
                    return { name, size, date };
                });
                resolve(fileListWithYear.filter((file) => file.name.trim().length > 0));
            });
            dataSocket.on('error', (err: Error) => {
                reject(err);
            });
        });
    }

    /**
     * Converts a month string to its corresponding number.
     * @param month The month string.
     * @returns The month number.
     */
    private monthToNumber(month: string): number {
        const months: { [key: string]: number } = {
            'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
            'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
        };
        return months[month];
    }

    /**
     * Uploads a file to the FTP server.
     * @param localPath The local path of the file to upload.
     * @param remotePath The remote path where the file should be uploaded.
     */
    public async upload(localPath: string, remotePath: string): Promise<void> {
        const fileStream = fs.createReadStream(localPath);
        await this.sendCommand(`STOR ${remotePath}`);
        fileStream.pipe(this.socket as unknown as NodeJS.WritableStream);
    }

    /**
     * Downloads a file from the FTP server.
     * @param remotePath The remote path of the file to download.
     * @param localPath The local path where the file should be saved.
     */
    public async download(remotePath: string, localPath: string): Promise<void> {
        const fileStream = fs.createWriteStream(localPath);
        await this.sendCommand(`RETR ${remotePath}`);
        this.socket.pipe(fileStream);
    }

    /**
     * Removes a file from the FTP server.
     * @param path The path of the file to remove.
     */
    public async remove(path: string): Promise<void> {
        await this.sendCommand(`DELE ${path}`);
    }

    /**
     * Disconnects from the FTP server.
     */
    public async disconnect(): Promise<void> {
        await this.sendCommand('QUIT');
        this.socket.end();
    }
}

export default FTPSimpleManager;
