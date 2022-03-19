const { urls } = require('../pages/metamask.homepage')
const { routineRetries } = require('config').get('browser')
const log = require('../lib/logger')({ logger: 'file' })

const waitUntilExtensionIsLoaded = async (browser, { routine = 'waitUntilExtensionIsLoaded', page = 'metamask.extension.home', retry = routineRetries } = {}) => {
    try {
        await browser.waitUntilPageIsLoaded()
        await browser.waitUntilTabCountIs(2)
        await browser.switchContextToNthTab(1)
        await browser.waitUntilUrlIs(urls.main)
        log.debug(`routine: ${routine} attempt successful.\nRemaining Retries: ${retry - 1}`)
    } catch (err) {
        log.debug(`routine: ${routine} failed. Error: ${err}\nRemaining Retries: ${retry - 1}`)
        await browser.takeEvidence({ page, routine })
        if (retry > 0) {
            await browser.refresh()
            return await waitUntilExtensionIsLoaded(browser, { retry: retry - 1 })
        }
        else throw (`routine: '${routine}' failed after ${routineRetries} retries.\nPlease try again`)
    }
}

module.exports = { waitUntilExtensionIsLoaded }
