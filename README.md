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
    -u --url <u>       Request URL to spam
    -m --method <m>    HTTP method
    -i --interval <i>  Request Interval (ms)
    -f --file <f>      Request Body (containing JSON array)

```
