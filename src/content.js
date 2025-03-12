loadjscssfile(browser.runtime.getURL("src/foo.js"), function() {
    loadjscssfile(browser.runtime.getURL("src/test.js"), function() {})
})

function loadjscssfile(filename, callback) {
    var fileref = document.createElement('script')
    fileref.setAttribute("type", "text/javascript")
    fileref.setAttribute("src", filename)
    if (fileref.readyState) {
        fileref.onreadystatechange = function() { /*IE*/
            if (fileref.readyState == "loaded" || fileref.readyState == "complete") {
                fileref.onreadystatechange = null;
                callback();
            }
        }
    } else {
        fileref.onload = function() {  /*Other browsers*/
            callback();
        }
    }

    // Try to find the head, otherwise default to the documentElement
    if (typeof fileref != "undefined")
        (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(fileref)
}