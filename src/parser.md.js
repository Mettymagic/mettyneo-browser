// parses .mn.js files
const regexHeader = /^(\/\/\s*==(.*)==.*\/\/\s*==\/(.*)==)\s*(.*)$/is
const regexData = /^\/\/\s*(@[\w-]*)\s*(.*)\s*$/igm
const regexVersion = /\d+(?:[\.-]\d+)*/
const regexMatchURL = /^(https?|\*):\/\/(.*?)(?:\/(.+))?$/igm

/*  url.search("^[https*]]{1,}[:\/\/]{0,}[w\.]{0,4}[\*|\.]{1,}[$|\/]") != -1 ||
        url.search("^[\.\*\/]{1,}$") != -1 ||
        url.search("^[https*]{1,}[:\/\/]{0,}[w\.]{0,4}[\.|\*|\/]{1,}$") != -1 ||
        url.search("^" + escapeForRegExp("*://*[$|\/]")) != -1 ||
        url.replace(new RegExp("(https|http|\\*).://\\*"), '') == "" ||
        url == "*"
        */

class Script {
    id = null
    version = null
    package = null
    run_at = RunAt.DOCUMENT_IDLE
    match = []
    requires = []
    metadata = {}
    content = null
}

const RunAt = Object.freeze({
    DOCUMENT_START: 0, //asap
    DOCUMENT_BODY:  1,  //once body exists
    DOCUMENT_END:   2,   //when DOMContentLoaded
    DOCUMENT_IDLE:  3   //after DOMContentLoaded, default
})

// Returns string of file text contents
async function readFile(fp) {
    const resp = await fetch(browser.runtime.getURL(fp), {mode:'same-origin'})
    return await resp.text()
}

// Separates the text of a script into its header and content
function parseScript(name, text){
    const m = text.match(regexHeader)
    if (m == null || m.length != 5) {
        console.error(`Error: Invalid or missing header in script "${name}"!`)
        return
    }
    if (m[2] != m[3]) {
        console.error(`Error: Mismatching header tags in script "${name}"!`)
        return
    }

    const script = new Script()
    script.content = m[4]

    let header = m[1]
    const tag = m[2]
    // limited cross-compatibility with existing tampermonkey scripts
    if (tag == "Userscript") parseTampermonkey(header, script)
    else parseMetadata(header, script)

    return script
}

// reads the header for any metadata instructions surrounding the script and inserts it into the script object
function parseMetadata(header, script) {
    const reg = header.matchAll(regexData)
    // extracts data from any tags
    for (const m of reg) {
        const tag = m[1]
        const val = m[2]
        switch(tag) {
            // useful values are elevated above metadata
            case "@id":
                //TODO make sure id isnt already registered
                script.id = val
                break
            // checks for valid version number format
            case "@version":
                if (regexVersion.test(val)) script.version = val
                else console.error("Invalid @version value!")
                break
            case "@package":
                script.package = val
                break
            // converts lower-case to UPPER_CASE and grabs the enum value
            case "@run-at":
                const str = val.toUpperCase().replace("-","_")
                var i = Object.keys(RunAt).find( (e) => e == str )
                if (i != undefined) script.run_at = i
                else console.error("Invalid @run-at value!")
                break
            // makes sure url regex is valid before appending to match list
            case "@match":
                console.log(isValidURLPattern(val))
                break
            // supports 3 options:
            // 1) url regex similar to @match linking to a js/css/etc script
            // 2) id:xxx to require another script to be present
            // 3) package:xxx to require another package of scripts to be present
            case "@requires":
                break
            //includes tag and its value inside of metadata by default
            default:
                script.metadata[tag.substring(1)] = val
                break
        }
        //console.log(`${tag} : ${val}`)
    }
    console.log(script)

    //fills in defaults for any missing tags
    
}

function isValidURLPattern(url) { return regexMatchURL.test(url) }

// parseMetadata() for pre-existing Tampermonkey scripts
function parseTampermonkey() {

}


parseScript("Test", await readFile("src/scripts/core/neo-label.mn.js"))