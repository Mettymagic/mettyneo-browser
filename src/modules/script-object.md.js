const ScriptObject = class {
    get id() { return this.metadata.id }
    get name() { return this.metadata.name }
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

export {ScriptObject as default}