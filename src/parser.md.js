// parses .mn.js files
const regexHeader = /^(\/\/\s*==(.*)==.*\/\/\s*==\/(.*)==)\s*(.*)$/is
const regexData = /^\/\/\s*(@[\w-]*)\s*(.*)\s*$/igm

//parseScript("Test", await readFile("src/scripts/core/neo-label.mn.js"))

class Script {
    id
    namespace
    metadata = {}
    match = []
    runtime
    requires = []
    content
}

const RunAt = Object.freeze({
    DOCUMENT_START:null, //asap
    DOCUMENT_BODY:null,  //once body exists
    DOCUMENT_END:null,   //when DOMContentLoaded
    DOCUMENT_IDLE:null   //after DOMContentLoaded, default
})

// Returns string of file text contents
async function readFile(fp) {
    const resp = await fetch(browser.runtime.getURL(fp), {mode:'same-origin'})
    return await resp.text()
}

// Separates the text of a script into its header and content
function parseScript(name, text){
    const m = text.match(regex_header)
    if (m == null || m.length != 5) {
        console.error(`Error: Invalid or missing header in script "${name}"!`)
        return
    }
    if (m[2] != m[3]) {
        console.error(`Error: Mismatching header tags in script "${name}"!`)
        return
    }

    const script = Script.new()
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
    
}

// parseMetadata() for pre-existing Tampermonkey scripts
function parseTampermonkey() {

}