// The main function script that runs on neopets.com pages and calls other scripts depending on what page is visited

run("src/neo/neo-label.js")

function isBeta() { return $("[class^='nav-pet-menu-icon']").length > 0 }

// Runs a script given a relative path
function run(script) {
    import(browser.runtime.getURL("")+script)
}
