import registry from "./registry.md.js"
import Script, {RunAt} from "./script-metadata.md.js"

// Collection of regex used
const regexHeader =     /^(\/\/\s*==(.*)==.*\/\/\s*==\/(.*)==)\s*(.*)$/is
const regexData =       /^\/\/\s*(@[\w-]*)\s*(.*)\s*$/igm
const regexVersion =    /\d+(?:[\.-]\d+)*/
const regexMatchURL = /^\*$|(?:(\*.|https?:\/\/|\*:\/\/)(.*?)(?:\/(.+))?$)/igm

// Enum representing error status
const Status = Object.freeze({
    INVALID: 0,
    IGNORED: 1,
    SUCCESS: 2
})

// Collection of metadata tags and any associated parse logic with it.
// Stored as a dictionary of tag : ()
const metadataParser = {
    strTags : [
        "name",
        "description",
        "author"
    ],
    addTags(list) {
        for(const tag of list) this.tags[tag] = this.defaultTagHandler(tag)
        return this
    },
    has(tag) { return tag in this.tags },
    trimValue(tag, val) {
        const noComment = val.replace(/\s+\/\/.*/gm, "")
        if (this.strTags.includes(tag)) return noComment
        else {
            var split = noComment.split(/(\s+)/)
            if (split.length > 1) console.warn(`Tag @${tag} contains more than 1 word, other words ignored.`)
            return split[0]
        }
    },
    tags : {
        "id" : (val, script) => {
            if (registry.has(val)) {
                console.error("Invalid @id, ID is already used.")
                return Status.ERRORED
            }
            return metadataParser.defaultTagHandler("id")(val, script)
        },
        "version" : (val, script) => { 
            if (!regexVersion.test(val)) {
                console.error("Invalid @version number detected.")
                return Status.ERRORED
            }
            return metadataParser.defaultTagHandler("version")(val, script)
        },
        "run-at": (val, script) => {
            const str = val.toUpperCase().replace("-","_")
            var i = Object.keys(RunAt).find( (e) => e == str )
            if (!i) {
                console.error(`Invalid @run-at value '${val}' detected.`)
                return Status.ERRORED
            }
            return metadataParser.defaultTagHandler("run-at")(val, script)
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
    },
    // Default parsing behavior to read and record a tag's value
    defaultTagHandler : (tag) => {return function(val, script){
        if (script.metadata[tag]) { // don't override existing tags
            console.warning(`Duplicate @${tag} detected, ignored.`)
            return Status.IGNORED
        }
        script.metadata[tag] = val
        return Status.SUCCESS
    }}
}.addTags(["name", "author", "description", "icon", "package"]) 

const parser = {
    async readLocal(fp) {
        return this.parseScript(await this.localFileToString(fp))
    },

    // Returns string of file text contents
    async localFileToString(fp) {
        const resp = await fetch(browser.runtime.getURL(fp), {mode:'same-origin'})
        return resp.text()
    },

    // Turns a string representing a script file's content into a Script object, or null on error
    parseScript(text) {
        const m = text.match(regexHeader)
        if (m == null || m.length != 5) {
            console.error(`Error: Invalid or missing header in script "${name}"!`)
            return null
        }
        if (m[2] != m[3]) {
            console.error(`Error: Mismatching header tags in script "${name}"!`)
            return null
        }

        const script = new Script()
        script.content = m[4]

        let header = m[1]
        const tag = m[2]
        // limited cross-compatibility with existing tampermonkey scripts
        var status
        if (tag == "Userscript") status = this.parseTampermonkey(header, script)
        else status = this.parseHeader(header, script)
        if(!status) {
            console.error("Script could not be read.")
            return null
        }
        return script
    },

    // Reads the header for any metadata instructions surrounding the script and inserts it into the script object
    // Returns true if successful, false if errored
    parseHeader(header, script) {
        const lines = header.matchAll(regexData)
        // extracts data from any tags
        for (const line of lines) {
            const tag = line[1].substring(1)
            if (!metadataParser.has(tag)) {
                console.warn(`Unrecognised tag '@${tag}', ignored.`)
                continue
            }
            const val = metadataParser.trimValue(tag, line[2])
            // TODO error/warning reporting that is visual to the user ala tampermonkey
            const status = metadataParser.tags[tag](val, script)
            if (status == Status.ERRORED) {
                console.error("Fatal error parsing script header, process aborted.")
                return false
            }
        }
        return true
    },

    // replaces Tampermonkey syntax with MettyNeo syntax
    parseTampermonkey(header, script) {
        let compatHeader = header
        let compatScript = script//.replace
        // TODO replace functions here
        return this.parseHeader(compatHeader, script)
    },
}

function isValidURLPattern(url) { 
    return url.match(regexMatchURL).length > 0 
}

export {parser as default, metadataParser}