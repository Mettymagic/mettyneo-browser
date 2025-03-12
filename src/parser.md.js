console.log("Parser")
class Script {
    id
    namespace
    metadata
    match = []
    runtime
    requires = []
}

const RunAt = Object.freeze({
    DOCUMENT_START:null, //asap
    DOCUMENT_BODY:null,  //once body exists
    DOCUMENT_END:null,   //when DOMContentLoaded
    DOCUMENT_IDLE:null   //after DOMContentLoaded, default
})

function read_file(){

}

// parses .mn.js files
function parse_script(text){

}