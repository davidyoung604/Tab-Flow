var filter = "";
var windowId;
var window_div = document.getElementById("windows");
var filteredTabs = null;

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
			filteredTabs.push(tab_array[tab_index]);
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
	filteredTabs = [];
	
	if (document.getElementById("onlyCurrentWindow").checked) {
		chrome.tabs.getAllInWindow(windowId, printTabs);
	} else {
		chrome.windows.getAll( { "populate": true }, listTabs );
	}
}

function getBookmarkBarId(node_array) {
	var bookmarkBarId = null;
	for (i = 0; i < node_array.length; i++) {
		if (node_array[i].title === "Bookmarks Bar") {
			bookmarkBarId = node_array[i].id;
			break;
		}
		
		/* recurse to keep parsing through the tree */
		chrome.bookmarks.getChildren(node_array[i].id, getBookmarkBarId);
	}
	
	if (bookmarkBarId != null) {
		bookmarkFilteredTabs(bookmarkBarId);
	}
}

function bookmarkFilteredTabs(bookmarkBarId_) {
	var bookmarkParams = {
		"parentId": bookmarkBarId_,
		"title": "Tabulator Bookmarks"
	};
	
	chrome.bookmarks.create(bookmarkParams);
}

document.addEventListener("DOMContentLoaded", function() {
	document.getElementById("filter").addEventListener("keyup", updateTabList);
	document.getElementById("onlyCurrentWindow").addEventListener("click", updateTabList);
	document.getElementById("bookmarkButton").addEventListener("click",
		function () {
			chrome.bookmarks.getTree(getBookmarkBarId);
		}
	);
	updateTabList();
	document.getElementById("filter").focus();
});