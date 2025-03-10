// The main function script that runs on neopets.com pages and calls other scripts depending on what page is visited
//var x = browser.runtime.sendMessage({ test:"Hello!"});
//x.then((r)=>{console.log(r)}, (r)=>{console.log(r)})
function isBeta() { return $("[class^='nav-pet-menu-icon']").length > 0 }