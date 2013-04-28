var bookmarkFolderName = "Tabulator Bookmarks";
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

function parseNodesForTitle(nodeArray, searchTitle) {
	for (i = 0; i < nodeArray.length; i++) {
		if (nodeArray[i].title === searchTitle) {
			return nodeArray[i].id;
		}
	}
}

function getBookmarkBarId(node_array) {
	var bookmarkBarId = parseNodesForTitle(node_array, "Bookmarks Bar");
	if (bookmarkBarId == null) {
		/* recurse to keep parsing through the tree */
		for (i = 0; i < node_array.length; i++) {
			chrome.bookmarks.getChildren(node_array[i].id, getBookmarkBarId);
		}
	} else {
		bookmarkFilteredTabs(bookmarkBarId);
	}
}

function addBookmarksToFolder(folderId) {
	for (j = 0; j < filteredTabs.length; j++) {
		var bookmark = {
			"parentId": folderId,
			"title": filteredTabs[j].title,
			"url": filteredTabs[j].url
		};
		
		chrome.bookmarks.create(bookmark);
	}
}

function bookmarkFilteredTabs(bookmarkBarId_) {
	chrome.bookmarks.create( { "parentId": bookmarkBarId_, "title": bookmarkFolderName } );
}

function bookmarkCreated(id, node) {
	if (node.title === bookmarkFolderName) {
		addBookmarksToFolder(id);
	}
}

chrome.bookmarks.onCreated.addListener(bookmarkCreated);
document.addEventListener("DOMContentLoaded", function() {
	document.getElementById("filter").addEventListener("keyup", updateTabList);
	document.getElementById("onlyCurrentWindow").addEventListener("click", updateTabList);
	document.getElementById("bookmarkButton").addEventListener("click",
		function () {
			chrome.bookmarks.getTree(getBookmarkBarId);
		}
	);
	/* add listeners for bookmark creation/changes */
	updateTabList();
	document.getElementById("filter").focus();
});