const Script = class {
    get id() { return metadata.id }
    match = []
    requires = {
        url:[], 
        id:[], 
        package:[]
    }
    metadata = {}
    content = null
    validate() {
        //name required
        if (metadata.name == null) {
            console.error("@name required!")
            return false
        }
        //id defaults to name
        else if (id == null) id = name
        //match defaults to * (aka all pages the extension can access)
        if (match.length == 0) script.match.append("*")
        return true
    }
}

const RunAt = Object.freeze({
    //before DOM loads
    DOCUMENT_START: "document_start",   //document-start
    //after DOM loads but before resources load
    DOCUMENT_END: "document_end",       //document-end
    //after DOM and resources load, default
    DOCUMENT_IDLE: "document_idle"      //document-idle
})

export {Script as default, RunAt }