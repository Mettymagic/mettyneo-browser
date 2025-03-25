// Persistent registry of enabled userscripts and their metadata
const registry = {
    key: "scripts",
    get storage() { 
        return browser.storage.local.get(this.key) 
    },
    set storage(x) { 
        try {
            var obj = {}
            obj[this.key] = x
            browser.storage.local.set(obj) 
        } catch(err) {
            console.error(`Failed to set '${this.key}' storage: ${err}`)
        }
    },
    update(newStorage) { this.storage = newStorage},

    has(id) { return id in this.storage },
    
    register(script) {
        try {
            var stor = this.storage
            if (!(script.id in stor)) { 
                stor[script.id] = script 
                this.update(stor)
                console.log(`Script '${script.id}' registered.`)
            }
            else { console.error(`Failed to register script: ID '${script.id}' already registered.`) }
        } catch(err) {
            console.error(`Failed to register script: ${err}`)
        }
    },
    
    unregister(id) {
        try {
            var stor = this.storage
            if (id in stor) { 
                delete stor[id]
                this.update(stor)
            }
            else { console.error(`Failed to unregister script: ID '${id}' does not exist.`) }

        } catch(err) {
            console.error(`Failed to unregister script: ${err}`)
        }
    }
}

export {registry as default}

/*
browser.runtime.onStartup.addListener(()=>{
    loadRegistry()
})
 */
