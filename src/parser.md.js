// parses .mn.js files

// class that represents a script and its metadata
class Script {
    id = null
    version = "1.0"
    package = null
    run_at = RunAt.DOCUMENT_IDLE
    match = []
    required = {url:[], id:[], pkg:[]}
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
const regexHeader = /^(\/\/\s*==(.*)==.*\/\/\s*==\/(.*)==)\s*(.*)$/is
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


const regexData = /^\/\/\s*(@[\w-]*)\s*(.*)\s*$/igm
const regexVersion = /\d+(?:[\.-]\d+)*/
// reads the header for any metadata instructions surrounding the script and inserts it into the script object
function parseMetadata(header, script) {
    const reg = header.matchAll(regexData)
    // extracts data from any tags
    for (const m of reg) {
        const tag = m[1]
        const spl = m[2].split(/(\s+)/)
        let val = spl[0] //other vals only read first word
        const full_val = m[2] //used for name
        //warns if multiple words
        if (tag != "@name" && spl.length > 1){
            // skip warning if we do it as a comment
            if (!spl[1].substring(0,2) == "//") console.warn(`Multiple words detected in ${tag} value, reading val as "${val}".`)
        }
        switch(tag) {
            // useful values are elevated above metadata
            case "@id":
                //TODO make sure id isnt already registered
                script.id = val
                break
            // checks for valid version number format
            case "@version":
                if (regexVersion.test(val)) script.version = val
                else console.error("Invalid @version number!")
                break
            case "@package":
                script.package = val
                break
            // converts lower-case to UPPER_CASE and grabs the enum value
            case "@run-at":
                const str = val.toUpperCase().replace("-","_")
                var i = Object.keys(RunAt).find( (e) => e == str )
                if (i != undefined) script.run_at = i
                else console.error("Invalid @run-at value '"+val+"'!")
                break
            // makes sure url regex is valid before appending to match list
            case "@match":
                if(isValidURLPattern(val)) script.match.push(val)
                else console.error("Invalid @match url '"+val+"'!")
                break
            // supports 3 options:
            // 1) url regex similar to @match linking to a js/css/etc script
            // 2) id:xxx to require another script to be present
            // 3) package:xxx to require another package of scripts to be present
            case "@requires":
                switch(val.split(":")?.[0]) {
                    case "id":
                        script.required.id.push(val.substring(3))
                        break
                    case "package":
                        script.required.pkg.push(val.substring(8))
                        break
                    default:
                        if (isValidURLPattern(val)) script.required.url.push(val)
                        else console.error("Invalid @requires url '"+val+"'!")
                        break
                }
                break
            case "@name":
                script.metadata.name = full_val
                break
            //includes tag and its value inside of metadata by default
            default:
                script.metadata[tag.substring(1)] = val
                break
        }
    }

    //name required
    if (script.metadata.name == null) console.error("@name required!")
    //id defaults to name
    else if (script.id == null) script.id = script.name
    //match defaults to * (aka all pages the extension can access)
    if (script.match.length == 0) script.match.append("*")

    console.log(script)
}

const regexMatchURL = /^\*$|(?:(\*.|https?:\/\/|\*:\/\/)(.*?)(?:\/(.+))?$)/igm
// matches url to the above regex to make sure its valid
function isValidURLPattern(url) { return url.match(regexMatchURL).length > 0 }

// parseMetadata() for pre-existing Tampermonkey scripts
function parseTampermonkey(header, script) {
    let compatHeader = header
    let compatScript = script
    // replace functions here
    parseMetadata(compatHeader, script)
}

parseScript("Test", await readFile("src/scripts/core/neo-label.mn.js"))