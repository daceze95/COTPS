# metamask-automata
Metamask Chrome Extension Automation Bot Powered by Selenium WebDriver &amp; Node.js

## Installation
- OS: Windows, Linux, and macOS
- Pre-requisites: Google Chrome, node.js
- Clone and checkout to `main` branch from https://github.com/ahsan-babar/metamask-automata
- Navigate to the folder and use the node package manager [npm](https://www.npmjs.com/) to install dependencies

```bash
npm install
```

## Environmental Configuration
Set your desired configurations in a `.env` and keep them at the root level of the project.
Sample `.env` file's contents should look like this:

```bash
#Browser Window Dimensions
BROWSER_WIDTH=1920
BROWSER_HEIGHT=1200

#Browser Modes Toggles 1 to enable, 0 to disable
BROWSER_EVIDENCES_ENABLED=0

#Metamask new password before importing a wallet 
METAMASK_NEW_PASSWORD=12345678

#Metamask seed file path
METAMASK_SEED_FILE_PATH=data/seed.txt

#Metamask Automata bot's output files directory
METAMASK_BOT_OUTPUT_FILE_DIR=output

#Metamask Automata bot's wallet data output filename prefix
METAMASK_BOT_OUTPUT_WALLETS_FILE_PREFIX=wallets

#Toggle to enable/disable Wallet Data scraping. Set 1 to enable or 0 to disable 
METAMASK_BOT_SCRAPE_WALLET_ENABLED=1
```

## Usage
After setting the above configurations in `.env` file, run the following command to execute the scraping:
```bash
 npm start
```

## Debug
debug logs can be found in `debug.log` file being generated during the execution.

## Contact
Please feel free to reach out at https://www.fiverr.com/ahsanbabar147 in case of any concerns.