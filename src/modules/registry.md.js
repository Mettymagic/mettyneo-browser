// Persistent registry of enabled userscripts and their metadata
const registry = {
    key: "scripts",
    get storage() { 
        return browser.storage.local.get(key) 
    },
    set storage(x) { 
        try {
            var obj = {}
            obj[key] = x
            browser.storage.local.set(obj) 
        } catch(err) {
            console.error(`Failed to set '${key}' storage: ${err}`)
        }
    },
    update(newStorage) { storage = newStorage},

    has(id) { return id in storage },
    
    register(script) {
        try {
            var stor = storage
            if (!(script.id in stor)) { 
                stor[script.id] = script 
                update(stor)
                console.log(`Script '${script.id}' registered.`)
            }
            else { console.error(`Failed to register script: ID '${script.id}' already registered.`) }
        } catch(err) {
            console.error(`Failed to register script: ${err}`)
        }
    },
    
    unregister(id) {
        try {
            var stor = storage
            if (id in stor) { 
                delete stor[id]
                update(stor)
            }
            else { console.error(`Failed to unregister script: ID '${id}' does not exist.`) }

        } catch(err) {
            console.error(`Failed to unregister script: ${err}`)
        }
    }
}

export { default as registry}

/*
browser.runtime.onStartup.addListener(()=>{
    loadRegistry()
})
 */
