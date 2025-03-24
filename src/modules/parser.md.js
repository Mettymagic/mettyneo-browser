import registry from "./registry.md.js"
import {Script, RunAt} from "./script-metadata.md.js"

const regexHeader =     /^(\/\/\s*==(.*)==.*\/\/\s*==\/(.*)==)\s*(.*)$/is
const regexData =       /^\/\/\s*(@[\w-]*)\s*(.*)\s*$/igm
const regexVersion =    /\d+(?:[\.-]\d+)*/
const regexMatchURL = /^\*$|(?:(\*.|https?:\/\/|\*:\/\/)(.*?)(?:\/(.+))?$)/igm

const metadataTags = {
    addTags(tags) {
        for(const tag of tags) metadataTags[tag] = defaultTagHandler(tag)
    },
    "id" : (val, script) => {
        if (registry.has(val)) {
            console.error("Invalid @id, ID is already used.")
            return Status.ERRORED
        }
        defaultTagHandler(tag)(val, script)
    },
    "version" : (val, script) => { 
        if (!regexVersion.test(val)) {
            console.error("Invalid @version number detected.")
            return Status.ERRORED
        }
        defaultTagHandler(tag)(val, script)
    },
    "run-at": (val, script) => {
        const str = val.toUpperCase().replace("-","_")
        var i = Object.keys(RunAt).find( (e) => e == str )
        if (!i) {
            console.error(`Invalid @run-at value '${val}' detected.`)
            return Status.ERRORED
        }
        defaultTagHandler(tag)(val, script)
    },
    "match": (val, script) => {
        if(!isValidURLPattern(val)) {
            console.error(`Invalid @match url '${val}' detected.`)
            return Status.ERRORED
        }
        if(val in script.match) {
            console.warning(`Duplicate @match url '${val}' detected, ignored.`)
            return Status.IGNORED
        }
        script.match.push(val)
        return Status.SUCCESS
    },
    "requires": (val, script) => {
        const split = val.split(/:(.*)/s)
        const k = split[0]
        const v = split[1]
        switch(k) {
            // requires script id
            case "id":
                if(v in script.required.id) {
                    console.warning(`Duplicate @requires '${val}' detected, ignored`)
                    return Status.IGNORED
                }
                script.requires.id.push(v)
                break
            // requires package id
            case "package":
                if(v in script.required.package) {
                    console.warning(`Duplicate @requires '${val}' detected, ignored`)
                    return Status.IGNORED
                }
                script.requires.package.push(val.substring(8))
                break
            // requires url
            default:
                if (!isValidURLPattern(val)) {
                    console.error("Invalid @requires url '"+val+"'.")
                    return Status.INVALID
                } 
                script.requires.url.push(val)
                break
        }
        return Status.SUCCESS
    }
}.addTags(["name", "author", "description", "icon"])

const Status = Object.freeze({
    INVALID: 0,
    IGNORED: 1,
    SUCCESS: 2
})

const defaultTagHandler = (tag) => {return function(val, script){
    if (script.metadata[tag]) { // don't override existing tags
        console.warning(`Duplicate ${tag} detected, ignored.`)
        return Status.IGNORED
    }
    script.metadata[tag] = val
    return Status.SUCCESS
}}

const parser = {
    // Returns string of file text contents
    async readFile(fp) {
        const resp = await fetch(browser.runtime.getURL(fp), {mode:'same-origin'})
        return await resp.text()
    },

    // Separates the text of a script into its header and content
    parseScript(name, text){
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
        else parseHeader(header, script)

        return script
    },

    // Reads the header for any metadata instructions surrounding the script and inserts it into the script object
    parseHeader(header, script) {
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
            
        }

        
    },

    // replaces Tampermonkey syntax with MettyNeo syntax
    parseTampermonkey(header, script) {
        let compatHeader = header
        let compatScript = script
        // TODO replace functions here
        parseHeader(compatHeader, script)
    },

    isValidURLPattern(url) { 
        return url.match(regexMatchURL).length > 0 
    },
}

export {default as parser, metadataTags}
//parseScript("Test", await readFile("src/scripts/core/neo-label.mn.js"))