const reader = require("readline-sync");

module.exports = {
  'Scrape Alachua Clerk of Court' : function (browser) {
    browser
      .url('https://www.alachuaclerk.org/court_records/index.cfm')
      .waitForElementVisible('#captcha')
      .click('#captcha')

      .perform(function() {
        const captchaWait = reader.question("Enter CAPTCHA Text on browser, then press ENTER in this window to continue...");
        console.log(`Thanks!`);
      })

      .pause(50)
      .click('#LoginForm input[type=submit]')
      .pause(100)
      .url('https://www.alachuaclerk.org/court_records/gis/')
      .pause(10000)
      .end();
  }
};
