import registry from "./registry.md.js"
import Script from "./script-object.md.js"

// Collection of regex used
const regexHeader =     /^(\/\/\s*==(.*)==.*\/\/\s*==\/(.*)==)\s*(.*)$/is
const regexData =       /^\/\/\s*(@[\w-]*)\s*(.*)\s*$/igm
const regexVersion =    /\d+(?:[\.-]\d+)*/
const regexMatchURL = /^\*$|(?:(\*.|https?:\/\/|\*:\/\/)(.*?)(?:\/(.+))?$)/igm
const regexRunAt = /document[-_](?:start|end|idle)/igm

// Enum representing error status
const Status = Object.freeze({
    INVALID: 0,
    IGNORED: 1,
    SUCCESS: 2
})

// Collection of metadata tags and any associated parse logic with it.
// Stored as a dictionary of tag : async function(val, script)
const metadataParser = {
    has(tag) { return tag in this.tags },

    async parseLine(script, tag, val) {
        // skip if we don't read the tag
        if (!this.has(tag)) {
            console.warn(`Unrecognised tag '@${tag}' ignored.`)
            return Status.IGNORED
        }
        // skip if we've already read this tag, even if said tag was ignored
        if (this.tags[tag].multitag != true && script.metadata[tag] === null) {
            console.warn(`Duplicate tag '@${tag}' ignored.`)
            return Status.IGNORED
        }
        // get info on how to read the tag
        const parser = this.tags[tag]
        // decide whether to read the full value or just the first word
        const v = this.trimValue(tag, val)
        // test if the value is valid for the tag
        const status = parser.test ? await parser.test(v, script) : Status.SUCCESS
        // if everything's good, set the script's metadata
        if (status == Status.SUCCESS) script.metadata[tag] = v
        else if (status == Status.IGNORED && script.metadata[tag] === undefined) script.metadata[tag] = null 
        return status
    },
    
    tags : {
        "name" : {
            multiword: true
        },
        "description" : {
            multiword: true
        },
        "author" : {
            multiword: true
        },
        "icon" : {
            test: async (val, script) => { 
                if (!matchURL(val)) {
                    console.warn(`Invalid @icon value '${val}', ignored.`)
                    return Status.IGNORED
                }
                return Status.SUCCESS
            }
        }, 
        "package" : {},
        "id" : {
            test: async (val, script) => {
                if (await registry.has(val)) {
                    console.error(`Invalid @id value '${val}', ID is already used.`)
                    return Status.ERRORED
                }
                return Status.SUCCESS
            }
        },
        "version" : {
            test: async (val, script) => { 
                if (!regexVersion.test(val)) {
                    console.error(`Invalid @version number '${val}' detected.`)
                    return Status.ERRORED
                }
                return Status.SUCCESS
            },
        },
        "run-at": {
            test: async (val, script) => {
                if (!regexRunAt.test(val)) {
                    console.error(`Invalid @run-at value '${val}' detected.`)
                    return Status.ERRORED
                }
                return Status.SUCCESS
            }
        },
        "match": {
            test: async (val, script) => {
                if(!matchURL(val)) {
                    console.error(`Invalid @match url '${val}' detected.`)
                    return Status.ERRORED
                }
                if(val in script.match) {
                    console.warning(`@match url '${val}' already registered, ignored duplicate.`)
                    return Status.IGNORED
                }
                return Status.SUCCESS
            },
            multitag : true
        },
        "requires": {
            test: async (val, script) => {
                const split = val.split(/:(.*)/s)
                const k = split[0]
                const v = split[1]
                switch(k) {
                    // requires script id
                    case "id":
                        if(v in script.requires.id) {
                            console.warning(`@requires '${val}' already registered, ignored duplicate.`)
                            return Status.IGNORED
                        }
                        break
                    // requires package id
                    case "package":
                        if(v in script.requires.package) {
                            console.warning(`@requires '${val}' already registered, ignored duplicate.`)
                            return Status.IGNORED
                        }
                        break
                    // requires url
                    default:
                        if (!matchURL(val)) {
                            console.error(`Invalid @requires url '${val}'.`)
                            return Status.INVALID
                        }
                        if (v in script.requires.url) {
                            console.warning(`@requires '${val}' already registered, ignored duplicate.`)
                        }
                        break
                }
                return Status.SUCCESS
            },
            multitag : true
        }
    },

    trimValue(tag, val) {
        const noComment = val.replace(/\s+\/\/.*/gm, "")
        if(this.tags[tag].multiword != true) {
            var split = noComment.split(/(\s+)/)
            if (split.length > 1) console.warn(`Tag @${tag} contains more than 1 word, other words ignored.`)
            return split[0]
        }
        return noComment
    }
}

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
    async parseScript(text) {
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
        const header = m[1]
        //const tag = m[2]
        //if (tag == "Userscript") var success = this.parseTampermonkey(header, script)
        //else success = this.parseHeader(header, script)
        if(!(await this.parseHeader(header, script))) {
            console.error("Script could not be read.")
            return null
        }
        script.content = m[4]
        return script
    },

    // Reads the header for any metadata instructions surrounding the script and inserts it into the script object
    // Returns true if successful, false if errored
    async parseHeader(header, script) {
        const lines = header.matchAll(regexData)
        // extracts data from any tags
        var j = 0
        var i = 0
        for (const line of lines) {
            const tag = line[1].substring(1)
            const val = line[2]
            // TODO error/warning reporting that is visual to the user ala tampermonkey
            const status = await metadataParser.parseLine(script, tag, val)
            if (status == Status.ERRORED) {
                console.error("Fatal error parsing script header, process aborted.")
                return false
            }
            if (status == Status.SUCCESS) i += 1
            j += 1
        }
        console.log(`Successfully parsed ${i}/${j} header values.`)
        return true
    }
}

function matchURL(url) { 
    return url?.match(regexMatchURL)?.length > 0  || false
}

export {parser as default, metadataParser}