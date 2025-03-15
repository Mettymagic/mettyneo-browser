loadjscssfile(browser.runtime.getURL("src/foo.js"), function() {
    loadjscssfile(browser.runtime.getURL("src/test.js"), function() {})
})