import "./parser.md.js"
function load_script(fp, callback) {
    var script = document.createElement('script')
    script.type = "module"
    script.onload = () => {
        console.log("Source loaded: " + url)
        callback
    }
    script.src = browser.runtime.getURL(fp)
    document.head.appendChild(script)
}