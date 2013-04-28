function getTabs(tabs) {
	for (i = 0; i < tabs.length; i++) {
		var div = document.getElementById("windows");
		div.innerHTML += tabs[i].url + "<br />";
	}
}

function listTabs(windows) {
	var div = document.getElementById("windows");
	
	for (i = 0; i < windows.length; i++) {
		var tabs = windows[i].tabs;
		div.innerHTML += windowHeader(i);

		for (j = 0; j < tabs.length; j++) {			
			div.innerHTML += tabs[j].url + "<br />";
		}
	}
}

function windowHeader(num) {
	return "<h2>Window " + num + "</h2>";
}

function updateTabList() {
	document.getElementById("windows").innerHTML = "";
	if (document.getElementById("onlyCurrentWindow").checked) {
		chrome.windows.getCurrent(
			function (window) {
				chrome.tabs.getAllInWindow(window.id, getTabs);
			}
		);
	} else {
		chrome.windows.getAll( { "populate": true }, listTabs );
	}
}

document.addEventListener("DOMContentLoaded", function() {
	document.getElementById("onlyCurrentWindow").addEventListener("click", updateTabList);
	updateTabList();
	/* need to add filter logic */
});