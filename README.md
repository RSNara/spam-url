# Spam-url

Sends each object in a provided JSON array to the location specified by the URL. By default, the script reads from standard input. You can alternatively specify the file-path, if you like.

## Installation

```bash
npm install -g spam-url
```

## Usage

```bash

  Usage: spam-url [options]

  Options:

    -h, --help         output usage information
    -V, --version      output the version number
    -u --url <u>       request URL to spam
    -m --method <m>    HTTP method (default: POST)
    -i --interval <i>  request interval in ms (default: 1000)
    -f --file <f>      request body (containing JSON array)

```
