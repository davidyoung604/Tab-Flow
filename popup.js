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
var WINDOW_DIV = $("windows").raw();
var FEEDBACK_DIV = $("feedback").raw();

var filteredTabs;
var useURLs;
var currentWindowId;

function iterateOverList(list, func) {
    for (var i = 0; i < list.length; i++) { func(i, list[i]); }
}

function setFeedbackText(text) {
    FEEDBACK_DIV.innerHTML = text;
}

function getWindowHeader(num, winId) {
    var isCurrent = (winId == currentWindowId) ? " (current window)" : "";
    return "<h3>Window " + (num + 1) + isCurrent + "</h3>";
}

function getLinkForTab(tabId, tabText) {
    return "&gt; <a href='#' id='" + tabId + "'>" + tabText + "</a>";
}

function filterAndPrintTabLinks(tabArray) {
    iterateOverList(tabArray, function(index, tab) {
        var tabText = useURLs ? tab.url : tab.title;
        if ( regex.test(tabText) ) {
            filteredTabs.push(tab);
            WINDOW_DIV.innerHTML += getLinkForTab(tab.id, tabText) + "<br />";
        }
    } );
}

function jumpToTabOnEvent(event) {
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
    var onlyCurrent = $("onlyCurrentWindow").raw().checked;
    useURLs = $("useURLs").raw().checked;
    filteredTabs = [];
    
    iterateOverList(windows, function(index, window) {
        if (onlyCurrent && window.id != currentWindowId) { return; }
        WINDOW_DIV.innerHTML += getWindowHeader(index, window.id);
        filterAndPrintTabLinks(window.tabs);
    } );
    
    iterateOverList(filteredTabs, function(index, tab) {
        $("" + tab.id).on("click", jumpToTabOnEvent);
    } );
}

function updateTabList() {
    regex = new RegExp( $("filter").raw().value, "i" );
    FEEDBACK_DIV.innerHTML = "";
    WINDOW_DIV.innerHTML = "";
    
    chrome.windows.getCurrent( function (window) {
        currentWindowId = window.id;
        chrome.windows.getAll( { "populate": true }, listTabs );
    } );
}

function parseNodesForTitle(nodeArray, searchTitle) {
    for (i = 0; i < nodeArray.length; i++) {
        if (nodeArray[i].title.toLowerCase() === searchTitle.toLowerCase()) {
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
    if ( !(d instanceof Date) ) {
        d = new Date();
    }
    
    var str = d.getFullYear() + "-" +
        pad( d.getMonth()+1 ) + "-" + /* months go from 0-11 */
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

function getIdList(nodeArray) {
    var ids = Array();
    for (var i = 0; i < nodeArray.length; i++) {
        ids.push( nodeArray[i].id );
    }
    return ids;
}

function moveTabsToWindow(window) {
    chrome.tabs.move( getIdList(filteredTabs), { "windowId": window.id, "index": -1 } );
    chrome.windows.update( window.id, { "focused": true } );
}

function closeTabs() {
    chrome.tabs.remove( getIdList(filteredTabs), function () {
        $("filter").raw().value = "";
        $("filter").raw().focus();
        updateTabList();
        setFeedbackText(filteredTabs.length + " tabs closed");
    } );
}

/* listeners */
document.addEventListener("DOMContentLoaded", function() {
    var defaultURLs = localStorage.defaultURLs || "false";
    $("useURLs").raw().checked = ( defaultURLs.toLowerCase().indexOf("true") === 0 );
    
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
        $("filter").raw().focus();
    }, 500 );
});
