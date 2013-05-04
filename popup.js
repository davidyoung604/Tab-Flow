/********************************************************
 * Project   : TabYouLater (Tabulator)
 * Author    : David Young
 * Date      : May 1, 2013
 * Copyright : All rights reserved.
 * Licence   : Feel free to make changes for yourself,
 *             but you are not permitted to release anything
 *             based on my code. However, you're encouraged
 *             to send me a pull request on GitHub, and you'll
 *             receive credit for any enhancements I include.
 ********************************************************/
 
 /* TODO: add feedback for the user */

var bookmarkFolderName = "TabYouLater Bookmarks";
var filter = "";
var windowId;
var window_div = document.getElementById("windows");
var filteredTabs = null;
var allTabs = null;

function windowHeader(num, win_id) {
	isCurrent = (win_id == windowId) ? " (current window)" : "";
	return "<h3>Window " + num + isCurrent + "</h3>";
}

function tabLink(tab) {
	return "<a href='#' id='" + tab.id + "'>" + tab.url + "</a>";
}

function printTabs(tab_array) {
	var re = new RegExp(filter, "i");
	
	for (tab_index = 0; tab_index < tab_array.length; tab_index++) {
		var tab = tab_array[tab_index];
		if ( re.test(tab.url) ) {
			filteredTabs.push(tab);
			window_div.innerHTML += tabLink(tab) + "<br />";
		}
	}
	
	allTabs = allTabs.concat(filteredTabs);
}

function listTabs(windows) {
	var onlyCurrent = document.getElementById("onlyCurrentWindow").checked;
	filteredTabs = []; /* reset the list of tabs */
	allTabs = [];
	
	for (win_index = 0; win_index < windows.length; win_index++) {
		var window = windows[win_index];
		if (onlyCurrent && window.id != windowId) { continue; }
		window_div.innerHTML += windowHeader(win_index, window.id);
		printTabs(window.tabs);
	}
	
	/* iterate through again to add the listeners (innerHTML append wipes it out) */
	for (i = 0; i < allTabs.length; i++) {
		var tab = allTabs[i];
		document.getElementById("" + tab.id).addEventListener("click", function (e) {
			chrome.tabs.update( parseInt(e.target.id), { "active": true } );
		} );
	}
}

function updateTabList() {
	filter = document.getElementById("filter").value;
	document.getElementById("windows").innerHTML = "";
	chrome.windows.getCurrent( function (window) {
		windowId = window.id;
		chrome.windows.getAll( { "populate": true }, listTabs );
	} );
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
		chrome.bookmarks.create( {
			"parentId" : folderId,
			"title"    : filteredTabs[j].title,
			"url"      : filteredTabs[j].url
		} );
	}
}

function pad(n) {
	return (n > 9) ? n : "0" + n;
}

function getFormattedDate(d) {
	if ( !(d instanceof Date) ) { /* damn noobs */
		d = new Date();
	}
	
	var str = d.getFullYear() + "-" +
		pad( d.getMonth()+1 ) + "-" + /* months go from 0-11. derp. */
		pad( d.getDate() );
	str += " " +
		pad( d.getHours() ) + ":" +
		pad( d.getMinutes() ) + ":" +
		pad( d.getSeconds() );
	
	return str;
}

function bookmarkFilteredTabs(bookmarkBarId_) {
	var dateString = getFormattedDate( new Date() );
	
	chrome.bookmarks.create( {
		"parentId" : bookmarkBarId_,
		"title"    : bookmarkFolderName + " " + dateString
	} );
}

function bookmarkCreated(id, node) {
	/* starts with the folder name (because we append timestamps) */
	if (node.title.indexOf(bookmarkFolderName) == 0) {
		addBookmarksToFolder(id);
	}
}

function getIDs() {
	var ids = Array();
	
	for (i = 0; i < filteredTabs.length; i++) {
		ids.push( filteredTabs[i].id );
	}
	
	return ids;
}

function moveTabsToWindow(window) {
	var ids = getIDs(filteredTabs);
	var moveProperties = {
		"windowId" : window.id,
		"index"    : -1
	};
	
	/* start at i=1 because we needed the first tab to
	   open the window without the "new tab" page */
	for (i = 1; i < ids.length; i++) {
		chrome.tabs.move( ids[i], moveProperties, function () {
			updateTabList();
		} );
	}
}

function closeTabs() {
	chrome.tabs.remove( getIDs(filteredTabs), function () {
		updateTabList();
	} );
}

/* listeners */
chrome.bookmarks.onCreated.addListener(bookmarkCreated);

document.addEventListener("DOMContentLoaded", function() {
	document.getElementById("filter").addEventListener("keyup", updateTabList);
	document.getElementById("onlyCurrentWindow").addEventListener("click", updateTabList);
	updateTabList();
	
	document.getElementById("bookmark").addEventListener("click", function () {
		if (filteredTabs.length == 0) { return; }
		chrome.bookmarks.getTree(getBookmarkBarId);
	} );
	
	document.getElementById("move").addEventListener("click", function () {
		if (filteredTabs.length == 0) { return; }
		chrome.windows.create( {
			"focused" : false,
			"tabId"   : filteredTabs[0].id
		}, moveTabsToWindow);
	} );
	
	document.getElementById("close").addEventListener("click", function () {
		if (filteredTabs.length == 0) { return; }
		closeTabs();
	} );
});
