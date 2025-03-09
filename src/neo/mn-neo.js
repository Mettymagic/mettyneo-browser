// The main function script that runs on neopets.com pages and calls other scripts depending on what page is visited

console.log("in mn-neo")
var x = browser.runtime.sendMessage({ test:"Hello!"});
console.log(x)
x.then((r)=>{console.log(r)}, (r)=>{console.log(r)})
console.log(browser.runtime)
//run("src/neo/neo-label.js")
//load("label", "src/neo/neo-label.js")
//console.log(isBeta())
function isBeta() { return $("[class^='nav-pet-menu-icon']").length > 0 }

// Runs a script given its relative path
// Dynamic script injection is preferred over defining in manifest as we want people to enable/disable behavior
// Scripts are not actually loaded into the page
function run(path) {
    import(browser.runtime.getURL("")+path)
}

// Loads a script into the page's content given its relative path
// Useful for when other scripts need to reference functions defined by 
async function load(name, path) {
    try {
        await browser.contentScripts.register(
            {
                js: [path],
                matches: ["<all_urls>"]
            }
        )
    } catch(err) {
        console.error(err)
    }
}