import parser from "./modules/parser.md.js"

console.log(await parser.readLocal("src/scripts/core/neo-label.mn.js"))

//sends message to runtime, telling it to executeScript

function injectScript(script, cb) {
    var storage //= getStorage()
    browser.runtime.sendMessage({
        method: "executeScript",
        script: script,
        storage: storage
    })
}


// Using script tag has limitations and is detectable, which we don't want
/*
function load_local(fp, callback) {
    load_script(browser.runtime.getURL(fp))
}

function load_script(url, callback) {
    var script = document.createElement('script')
    script.type = "module"
    script.onload = () => {
        console.log("Source loaded: " + url)
        callback
    }
    script.src = url
    document.head.appendChild(script)
}
*/