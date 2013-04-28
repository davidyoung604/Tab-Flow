var filter = "";
var windowId;
var window_div = document.getElementById("windows");

function windowHeader(num, win_id) {
	if (win_id == windowId) {
		isCurrent = " (current window)";
	} else {
		isCurrent = "";
	}
	
	return "<h3>Window " + num + isCurrent + "</h3>";
}

function printTabs(tab_array) {
	var re = new RegExp(filter, "gi");
	
	for (tab_index = 0; tab_index < tab_array.length; tab_index++) {
		var url = tab_array[tab_index].url;
		if ( re.test(url) ) {
			window_div.innerHTML += url + "<br />";
		}
	}
}

function listTabs(windows) {
	for (win_index = 0; win_index < windows.length; win_index++) {
		window_div.innerHTML += windowHeader(win_index, windows[win_index].id);
		printTabs(windows[win_index].tabs);
	}
}

function retrieveCurrentWindowId(window) {
	windowId = window.id;
}

function updateTabList() {
	document.getElementById("windows").innerHTML = "";
	filter = document.getElementById("filter").value;
	chrome.windows.getCurrent(retrieveCurrentWindowId);
	
	if (document.getElementById("onlyCurrentWindow").checked) {
		chrome.tabs.getAllInWindow(windowId, printTabs);
	} else {
		chrome.windows.getAll( { "populate": true }, listTabs );
	}
}

document.addEventListener("DOMContentLoaded", function() {
	document.getElementById("filter").addEventListener("keyup", updateTabList);
	document.getElementById("onlyCurrentWindow").addEventListener("click", updateTabList);
	updateTabList();
	document.getElementById("filter").focus();
});