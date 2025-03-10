browser.runtime.onStartup.addListener(onStartup)
browser.runtime.onInstalled.addListener(onStartup)

// Runs when browser starts up and when extension is first installed
// Should be used to load any libraries and register any content scripts
function onStartup() {
    console.log("Startup")
    load("ball")
    register("a")
}

// Loads a script as a module in the background by adding a <script> tag to the background.
// Lets you use functions provided from the script by importing the module.
// See import(): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import
function load(fp) {
    var src = browser.runtime.getURL("")+fp
    if(!document.body.innerHTML.includes(`src="${src}"`)) document.body.innerHTML += `<script type="module" src="${src}"></script>`
}

// Registers a .mn.js content script if not previously registered
// .mn.js files contain metadata including allowed urls and run-at
async function register(fp) {
    console.log(await browser.scripting.getRegisteredContentScripts())
}