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

function iterateOverList(list, func) {
    for (var i = 0; i < list.length; i++) { func(i, list[i]); }
}

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
    iterateOverList(tabArray, function(index, tab) {
        var field = useURLs ? tab.url : tab.title;
        if ( regex.test(field) ) {
            filteredTabs.push(tab);
            WINDOW_DIV.innerHTML += tabLink(tab.id, field) + "<br />";
        }
    } );
    
    allTabs = allTabs.concat(filteredTabs);
}

function restoreTabFromClickEvent(event) {
    var id = parseInt(event.target.id, 10);
    
    chrome.tabs.get( id, function(tab) {
        chrome.windows.update(
            tab.windowId,
            { "focused": true },
            chrome.tabs.update( id, { "active": true } )
        );
    } );
}

function listTabs(windows) {
    var onlyCurrent = document.getElementById("onlyCurrentWindow").checked;
    useURLs = document.getElementById("useURLs").checked;
    filteredTabs = [];
    allTabs = [];
    
    iterateOverList(windows, function(index, window) {
         if (onlyCurrent && window.id != currentWindowId) { return; }
         WINDOW_DIV.innerHTML += windowHeader(index, window.id);
         printTabs(window.tabs);
    } );
    
    iterateOverList(allTabs, function(index, tab) {
        document.getElementById("" + tab.id).addEventListener("click", restoreTabFromClickEvent );
    } );
}

function updateTabList() {
    regex = new RegExp(document.getElementById("filter").value, "i");
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
    if (bookmarkBarId === null || bookmarkBarId === undefined) {
        /* recurse to keep parsing through the tree */
        for (i = 0; i < nodeArray.length; i++) {
            chrome.bookmarks.getChildren(nodeArray[i].id, getBookmarkBarId);
        }
    } else {
        bookmarkFilteredTabs(bookmarkBarId);
    }
}

function addBookmarksToFolder(bookmarkNode) {
    var folderId = bookmarkNode.id;
    for (var j = 0; j < filteredTabs.length; j++) {
        chrome.bookmarks.create( {
            "parentId" : folderId,
            "title"    : filteredTabs[j].title,
            "url"      : filteredTabs[j].url
        } );
    }
    
    setFeedbackText(filteredTabs.length + " tabs bookmarked");
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
    }, addBookmarksToFolder );
}

function getIDs(nodeArray) {
    var ids = Array();
    for (var i = 0; i < nodeArray.length; i++) {
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
document.addEventListener("DOMContentLoaded", function() {
    var defaultURLs = localStorage.defaultURLs || "false";
    $("useURLs").raw().checked =
        ( defaultURLs.toLowerCase().indexOf("true") === 0 );
    
    $("filter").on("keyup", updateTabList);
    $("useURLs").on("click", updateTabList);
    $("onlyCurrentWindow").on("click", updateTabList);
    updateTabList();
    
    $("bookmark").on("click", function () {
        if (filteredTabs.length === 0) { return; }
        chrome.bookmarks.getTree(getBookmarkBarId);
    } );
    
    $("move").on("click", function () {
        if (filteredTabs.length === 0) { return; }
        chrome.windows.create( {
            "focused" : false,
            "tabId"   : filteredTabs[0].id
        }, moveTabsToWindow);
    } );
    
    $("close").on("click", function () {
        if (filteredTabs.length === 0) { return; }
        closeTabs();
    } );
    
    window.setTimeout( function() {
        document.getElementById("filter").focus();
    }, 500 );
});
