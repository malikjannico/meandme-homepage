const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle0' });
    const appHtml = await page.evaluate(() => {
        return document.querySelector('#app').outerHTML;
    });
    fs.writeFileSync('../original_dom.html', appHtml);
    await browser.close();
    console.log('DOM extracted successfully.');
})();
