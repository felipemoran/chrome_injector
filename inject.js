var s = document.createElement('script');
s.src = chrome.runtime.getURL('create_map.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);
console.log("Injected")