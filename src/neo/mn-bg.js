browser.runtime.onMessage.addListener(onMessage)

function onMessage(msg) {
    console.log("onMessage")
    return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ response: "async response from background script" });
        }, 1000);
      });
}
//console.log(browser.scripting.registerContentScripts)