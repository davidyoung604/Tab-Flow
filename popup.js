/********************************************************
 * Project   : Tab Flow
 * Author    : David Young
 * Date      : May 1, 2013
 * Copyright : All rights reserved.
 * Licence   : Feel free to make changes for your own use,
 *             but you are not permitted to release anything
 *             based on my code in whole or in part.
 ********************************************************/

var BOOKMARK_FOLDER_NAME = "Tab Flow Bookmarks";
var WINDOW_DIV = document.getElementById("windows");
var FEEDBACK_DIV = document.getElementById("feedback");

function setFeedbackText(text) {
    FEEDBACK_DIV.innerHTML = text;
}

function windowHeader(num, winId) {
    isCurrent = (winId == currentWindowId) ? " (current window)" : "";
    return "<h3>Window " + num + isCurrent + "</h3>";
}

function tabLink(tabId, tabText) {
    return "<a href='#' id='" + tabId + "'>" + tabText + "</a>";
}

function printTabs(tabArray) {
    var re = new RegExp(filter, "i");
    
    for (tabIndex = 0; tabIndex < tabArray.length; tabIndex++) {
        var tab = tabArray[tabIndex];
        var field = useURLs ? tab.url : tab.title;
        if ( re.test(field) ) {
            filteredTabs.push(tab);
            WINDOW_DIV.innerHTML += tabLink(tab.id, field) + "<br />";
        }
    }
    
    allTabs = allTabs.concat(filteredTabs);
}

function listTabs(windows) {
    var onlyCurrent = document.getElementById("onlyCurrentWindow").checked;
    useURLs = document.getElementById("useURLs").checked;
    filteredTabs = [];
    allTabs = [];
    
    for (winIndex = 0; winIndex < windows.length; winIndex++) {
        var window = windows[winIndex];
        if (onlyCurrent && window.id != currentWindowId) { continue; }
        WINDOW_DIV.innerHTML += windowHeader(winIndex, window.id);
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
    FEEDBACK_DIV.innerHTML = "";
    WINDOW_DIV.innerHTML = "";
    
    chrome.windows.getCurrent( function (window) {
        currentWindowId = window.id;
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

function getBookmarkBarId(nodeArray) {
    var bookmarkBarId = parseNodesForTitle(nodeArray, "Bookmarks Bar");
    if (bookmarkBarId == null) {
        /* recurse to keep parsing through the tree */
        for (i = 0; i < nodeArray.length; i++) {
            chrome.bookmarks.getChildren(nodeArray[i].id, getBookmarkBarId);
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

function bookmarkFilteredTabs(bookmarkBarId) {
    var dateString = getFormattedDate( new Date() );
    
    chrome.bookmarks.create( {
        "parentId" : bookmarkBarId,
        "title"    : BOOKMARK_FOLDER_NAME + " " + dateString
    } );
}

function bookmarkCreated(id, node) {
    /* starts with the folder name (because we append timestamps) */
    if (node.title.indexOf(BOOKMARK_FOLDER_NAME) == 0) {
        addBookmarksToFolder(id);
        setFeedbackText(filteredTabs.length + " tabs bookmarked");
    }
}

function getIDs(nodeArray) {
    var ids = Array();
    
    for (i = 0; i < nodeArray.length; i++) {
        ids.push( nodeArray[i].id );
    }
    
    return ids;
}

function moveTabsToWindow(window) {
    chrome.tabs.move( getIDs(filteredTabs), { "windowId": window.id, "index": -1 } );
}

function closeTabs() {
    chrome.tabs.remove( getIDs(filteredTabs), function () {
        updateTabList();
        setFeedbackText(filteredTabs.length + " tabs closed");
    } );
}

/* listeners */
chrome.bookmarks.onCreated.addListener(bookmarkCreated);

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("filter").addEventListener("keyup", updateTabList);
    document.getElementById("onlyCurrentWindow").addEventListener("click", updateTabList);
    document.getElementById("useURLs").addEventListener("click", updateTabList);
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
