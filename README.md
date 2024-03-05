# ftp-simple-manager

## Overview

`ftp-simple-manager` is a simple FTP client library for Node.js that allows you to connect to FTP servers, perform file operations, and manage directories.

## Features

- **Connect to FTP Server**: Establish a connection to an FTP server.
- **Login**: Authenticate with a username and password.
- **List Directory Contents**: Retrieve a list of files and directories in a specified path.
- **Upload**: Upload files from the local filesystem to the FTP server.
- **Download**: Download files from the FTP server to the local filesystem.
- **Remove**: Delete files or directories from the FTP server.
- **Disconnect**: Close the connection to the FTP server.

## Installation

You can install `ftp-simple-manager` via npm:
npm install ftp-simple-manager

## API Documentation

Creates a new instance of FTPClient.
const ftp = new FTPSimpleManager(host, port, username, password, secure);

host (string): The hostname or IP address of the FTP server.
port (number, optional): The port number of the FTP server (default is 21).
username (string): The username for authentication.
password (string): The password for authentication.
secure (boolean, optional): Whether to use a secure TLS/SSL connection (default is false).

## Methods
connect(): Promise<void>: Establishes a connection to the FTP server.
connectAndLogin(): Promise<void>: Establishes a connection and logs in to the FTP server.
login(): Promise<void>: Logs in to the FTP server with the provided credentials.
list(path: string): Promise<{ name: string; size: number; date: Date }[]>: Retrieves a list of files and directories in the specified path.
upload(localPath: string, remotePath: string): Promise<void>: Uploads a file from the local filesystem to the FTP server.
download(remotePath: string, localPath: string): Promise<void>: Downloads a file from the FTP server to the local filesystem.
remove(path: string): Promise<void>: Deletes a file or directory from the FTP server.
disconnect(): Promise<void>: Closes the connection to the FTP server.

## Usage
Here's a basic example of how to use ftp-simple-manager:

const FTPSimpleManager = require('ftp-simple-manager');

const ftp = new FTPSimpleManager('host', 21, 'username', 'password');

const FTPSimpleManager = require('ftp-simple-manager');

const main = async () => {
    const ftp = new FTPSimpleManager('host', 21, 'username', 'password');

    try {
        await ftp.connectAndLogin();
        const files = await ftp.list('/');
        console.log('List of files:', files);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await ftp.disconnect();
    }
};

main();

## License
This project is licensed under the MIT License - see the LICENSE file for details.