const { urls, redirectUrls, locators } = require('../pages/metamask.restore.wallet')
const { locators: endOfFlowlocators } = require('../pages/metamask.wallet.congratulations')

const { locators: walletlocators, urls: walletUrls, redirectUrls: walletRedirectUrls } = require('../pages/metamask.wallet.home')

const { existsSync, mkdirSync, appendFileSync, writeFileSync } = require('fs')
const { Key } = require('selenium-webdriver')
const { createReadLineStream } = require('../lib/utils')
const { resolve } = require('path')
const moment = require('moment')
const {
    outputFileDir,
    seedFilePath,
    password,
    walletsFilePrefix,
    scrapeWalletEnabled
} = require('config').get('metamask')

const { routineRetries, defaultTimeout } = require('config').get('browser')
const log = require('../lib/logger')({ logger: 'file' })

const scrapeWalletData = async (browser, { routine = 'scrapeWalletData', page = 'metamask.import.wallet' } = {}) => {
    try {
        const importWalletBtn = await browser.findElement('css', locators.importWalletBtn)
        await browser.click(importWalletBtn)

        try {
            await browser.waitUntilUrlIs(redirectUrls.endOfFlow, 1, defaultTimeout / 3)
            const allDoneBtn = await browser.elementExist('css', endOfFlowlocators.allDoneBtn)
            allDoneBtn && await browser.click(allDoneBtn)
        } catch (err) {
            log.debug('Congratulations Page not loaded.')
        }

        await browser.waitUntilUrlIs(walletUrls.main)

        const popOverContentCloseeBtn = await browser.elementExist('css', walletlocators.popOverContentCloseeBtn)
        popOverContentCloseeBtn && await browser.click(popOverContentCloseeBtn)

        const etheriumBalance = await browser.findElement('css', walletlocators.etheriumBalance)
        const etheriumBalanceAmount = await etheriumBalance.getText()

        /* 
        const copyAccountAddressToClipBoardBtn = await browser.findElement('css', walletlocators.copyAccountAddressToClipBoardBtn)
        await browser.click(copyAccountAddressToClipBoardBtn)

        const sendBtn = await browser.findElement('css', walletlocators.sendBtn)
        await browser.click(sendBtn)

        await browser.waitUntilUrlIs(walletRedirectUrls.sendView)

        const ensInputField = await browser.findElement('css', walletlocators.ensInputField)
        await browser.input(ensInputField, Key.CONTROL + 'V')

        const ensInputTitle = await browser.findElement('css', walletlocators.ensInputTitle)

        const walletAddress = await ensInputTitle.getText()

        const closeSendForm = await browser.findElement('css', walletlocators.closeSendForm)
        await browser.click(closeSendForm)
        */

        const myAccountBtn = await browser.findElement('css', walletlocators.myAccountBtn)
        await browser.click(myAccountBtn)

        const lockAccountBtn = await browser.findElement('css', walletlocators.lockAccountBtn)
        await browser.click(lockAccountBtn)

        const unlockAccountPageToImportWalletLink = await browser.findElement('css', walletlocators.unlockAccountPageToImportWalletLink)
        await browser.click(unlockAccountPageToImportWalletLink)

        await browser.waitUntilUrlIs(walletRedirectUrls.restoreWallet)

        return { /* walletAddress, */ etheriumBalanceAmount }
    } catch (err) {
        log.debug(`routine: ${routine} failed. Error: ${err}\n`)
        await browser.takeEvidence({ page, routine })
        throw (`routine: '${routine}' failed. Please try again`)

    }
}

const loadSecurityPhraseVerificationPage = async (browser, { routine = 'loadSecurityPhrasVerificationPage', page = 'metamask.phrase.verification', retry = routineRetries } = {}) => {
    try {
        await browser.loadUrl(urls.main)
        await browser.waitUntilPageIsLoaded()
        log.debug(`routine: ${routine} attempt successful.\nRemaining Retries: ${retry - 1}`)
    } catch (err) {
        log.debug(`routine: ${routine} failed. Error: ${err}\nRemaining Retries: ${retry - 1}`)
        await browser.takeEvidence({ page, routine })
        if (retry > 0) {
            await browser.refresh()
            return await loadSecurityPhraseVerificationPage(browser, { retry: retry - 1 })
        }
        else throw (`routine: '${routine}' failed after ${routineRetries} retries.\nPlease try again`)
    }
}

const fillMandatoryInputs = async browser => {
    const newPasswordInput = await browser.findElement('css', locators.newPasswordInput)
    await browser.input(newPasswordInput, password)

    const confirmPasswordInput = await browser.findElement('css', locators.confirmPasswordInput)
    await browser.input(confirmPasswordInput, password)

    const termsCheckBox = await browser.elementExist('css', locators.termsCheckBox)
    termsCheckBox && await browser.click(termsCheckBox)
}

const validateSecurityPhrase = async (browser, { routine = 'verifySecurityPhrases', page = 'metamask.phrase.verification', phrase, appendIv = false, invalidFilepath, appendV = false, validFilepath, writeToFile = true, walletsFilepath = 'wallets.csv' } = {}) => {
    try {
        console.log('\n', phrase, '\n\n')
        if (scrapeWalletEnabled && parseInt(scrapeWalletEnabled)) {
            await fillMandatoryInputs(browser)
        }

        const recoveryPhraseInput = await browser.findElement('css', locators.recoveryPhraseInput)
        await browser.input(recoveryPhraseInput, phrase)

        const importWalletDisabledBtn = await browser.elementExist('css', locators.importWalletDisabledBtn)

        if (!!importWalletDisabledBtn) {
            console.log(`[-] | Invalid seed phrase: ${phrase}\n\n`)

            if (writeToFile) {
                if (appendIv) {
                    appendFileSync(invalidFilepath, phrase + '\n')
                }
                else {
                    writeFileSync(invalidFilepath, phrase + '\n')
                }
                writeToFile = false
            }
            appendIv = true;
        }
        else {
            console.log(`Valid: ${phrase}\n\n`)
            console.log(`[+] | Valid seed phrase: ${phrase}\n\n`)

            if (writeToFile) {

                if (appendV) {
                    appendFileSync(validFilepath, phrase + '\n')
                }
                else {
                    writeFileSync(validFilepath, phrase + '\n')
                }
                writeToFile = false
            }
            appendV = true;

            if (scrapeWalletEnabled && parseInt(scrapeWalletEnabled)) {
                const { etheriumBalanceAmount = '' } = await scrapeWalletData(browser);
                appendFileSync(walletsFilepath, `${phrase},${etheriumBalanceAmount}\n`)
            }

        }

        if (!(scrapeWalletEnabled && parseInt(scrapeWalletEnabled)) || !!importWalletDisabledBtn) {
            await browser.input(recoveryPhraseInput, Key.CONTROL + 'A')
            await browser.input(recoveryPhraseInput, Key.BACK_SPACE)
        }

        log.debug(`routine: ${routine} attempt successful.\n`)
        return { appendIv, appendV }
    } catch (err) {
        log.debug(`routine: ${routine} failed. Error: ${err}\n`)
        await browser.takeEvidence({ page, routine })
        throw (`routine: '${routine}' failed.\nPlease try again`)
    }
}

const verifySecurityPhrases = async (browser, { routine = 'verifySecurityPhrases', page = 'metamask.phrase.verification' } = {}) => {
    const dir = resolve(__dirname, `../${outputFileDir}`)
    const walletsFilepath = resolve(dir, `${walletsFilePrefix}_${moment().format('YYYY-MM-DD_HH_mm_ss')}.csv`)
    const seedFileNormalizedName = seedFilePath.replace(/[^\w\s\-]/gi, '_')
    const validFilepath = resolve(dir, `valid_${seedFileNormalizedName}.txt`)
    const invalidFilepath = resolve(dir, `invalid_${seedFileNormalizedName}.txt`)

    try {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true })
        }

        await browser.waitUntilUrlIs(urls.main)
        await browser.waitUntilPageIsLoaded()

        if (scrapeWalletEnabled && parseInt(scrapeWalletEnabled)) {
            writeFileSync(walletsFilepath, 'SEED,ETH' + '\n')
        }

        let appendV, appendIv

        if (!(scrapeWalletEnabled && parseInt(scrapeWalletEnabled))) {
            await fillMandatoryInputs(browser)
        }

        const seeds = createReadLineStream({ filepath: resolve(__dirname, `../${seedFilePath}`) })

        console.log(`[+] | Found seed file\n\n`)

        console.log(`[+] | Getting seeds from file\n\n`)

        console.log(`[+] | Starting the program... Please wait...\n\n`)


        for await (const phrase of seeds) {
            const result = await validateSecurityPhrase(browser, { phrase, appendV, validFilepath, appendIv, invalidFilepath, walletsFilepath })

            appendIv = result.appendIv
            appendV = result.appendV
        }
        log.debug(`routine: ${routine} attempt successful.\n`)
    } catch (err) {
        log.debug(`routine: ${routine} failed. Error: ${err}\n`)
        await browser.takeEvidence({ page, routine })
        throw (`routine: '${routine}' failed after ${routineRetries} retries.\n`)
    }
}

module.exports = { verifySecurityPhrases, loadSecurityPhraseVerificationPage }
