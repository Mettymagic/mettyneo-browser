// Persistent registry of enabled userscripts and their metadata
const registry = {
    key: "scripts",
    // Async getter
    get storage() { 
        return browser.storage.local.get(this.key) 
    },
    // Async setter
    async update(newStorage) { 
        var obj = {}
        obj[this.key] = newStorage
        return browser.storage.local.set(obj)
    },
    // Async includes
    async has(val) { 
        return this.storage.then(
            (stor) => { 
                // if string is given, check if contains key, otherwise check if contains value
                return (val instanceof String) ? id in stor : Object.values(stor).includes(val)
            }
        )
    },
    async clear() { return browser.storage.local.remove(this.key).then(()=>{console.log("Successfully cleared script registry.")}) },
    
    // Async append
    async register(script) {
        try {
            var stor = await this.storage
            if(!await this.has(script)) {
                stor[script.id] = script
                return this.update(stor).then(() => {
                    console.log(`Script '${script.id}' registered.`)
                })
            }
            else console.error(`Failed to register script: ID '${script.id}' already registered.`)
        } catch(err) {
            console.error(`Failed to register script: ${err}`)
        }
    },
    
    // Async remove
    async unregister(id) {
        try {
            var stor = await this.storage
            if (id in stor) { 
                delete stor[id]
                return this.update(stor)
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
