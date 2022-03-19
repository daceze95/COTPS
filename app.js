require('dotenv').config()
const Driver = require('./lib/Driver')
const fs = require('fs')
const path = require('path')
const { verifySecurityPhrases, loadSecurityPhraseVerificationPage } = require('./controllers/metamask.import.wallet');
const config = require('config');
const { waitUntilExtensionIsLoaded } = require('./controllers/metamask.homepage');

const main = async _ => {
    const browser = new Driver({
        extensions: config.get('browser.extensions').map(ext => path.resolve(__dirname, 'assets', ext))
    });
    try {
        console.log('-------------Execution Started-------------');
        fs.rmSync(path.resolve(__dirname, './evidence'), { recursive: true, force: true });
        await waitUntilExtensionIsLoaded(browser)
        await loadSecurityPhraseVerificationPage(browser)
        await verifySecurityPhrases(browser)
        console.log('-------------Execution Completed-------------');
    } catch (err) {
        console.error(err)
        await browser.quit()
    }
    finally {
        process.stdout.write(`Please find the debug logs of this execution in the 'debug.log' file.`)
        await browser.quit()
    }
}

main().
    then(console.log)
    .catch(console.error)
