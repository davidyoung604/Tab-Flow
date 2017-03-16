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
var hideDiscarded;
var currentWindowId;

function iterateOverList(list, func) {
    for (var i = 0; i < list.length; i++) { func(i, list[i]); }
}

function setFeedbackText(text) {
    FEEDBACK_DIV.innerHTML = text;
}

function getWindowHeaderHtml(num, window, numTabs) {
    var curWindowMarker = (window.id == currentWindowId) ? " (current window)" : "";
    return "<h3>Window " + (num + 1) + ": (" + numTabs + ")" + curWindowMarker + "</h3>";
}

function getLinkForTab(tabId, tabText) {
    return "&gt; <a href='#' id='" + tabId + "'>" + tabText + "</a>";
}

function filterTabs(tabArray) {
    var tempTabs = [];

    iterateOverList(tabArray, function(index, tab) {
        var tabText = useURLs ? tab.url : tab.title;
        if ( regex.test(tabText) && (!hideDiscarded || !tab.discarded) ) {
            tempTabs.push(tab);
        }
    });

    return tempTabs;
}

function getTabLinkHtml(tabArray) {
    var html = "";

    iterateOverList(tabArray, function(index, tab) {
        var tabText = useURLs ? tab.url : tab.title;
        html += getLinkForTab(tab.id, tabText) + "<br />";
    });

    return html;
}

function jumpToTabOnEvent(event) {
    var id = parseInt(event.target.id, 10);

    chrome.tabs.get( id, function(tab) {
        chrome.windows.update(
            tab.windowId,
            { "focused": true },
            chrome.tabs.update( id, { "active": true })
        );
    });
}

function listTabsForWindows(windowList) {
    var onlyCurrent = $("onlyCurrentWindow").raw().checked;
    useURLs = $("useURLs").raw().checked;
    hideDiscarded = $("hideDiscarded").raw().checked;
    filteredTabs = [];

    iterateOverList(windowList, function(index, window) {
        if (onlyCurrent && window.id != currentWindowId) { return; }
        var filtered = filterTabs(window.tabs);
        filteredTabs = filteredTabs.concat(filtered);
        var tabLinkHtml = getTabLinkHtml(filtered);
        WINDOW_DIV.innerHTML += getWindowHeaderHtml(index, window, filtered.length);
        WINDOW_DIV.innerHTML += tabLinkHtml;
    });

    iterateOverList(filteredTabs, function(index, tab) {
        $("" + tab.id).on("click", jumpToTabOnEvent);
    });
}

function updateTabList() {
    regex = new RegExp( $("filter").raw().value, "i" );
    FEEDBACK_DIV.innerHTML = "";
    WINDOW_DIV.innerHTML = "";

    chrome.windows.getCurrent( function (window) {
        currentWindowId = window.id;
        chrome.windows.getAll( { "populate": true }, listTabsForWindows );
    });
}

function getBookmarkFolderId(nodeArray, folderName) {
    for (i = 0; i < nodeArray.length; i++) { // NOTE: nodeArray will grow
        node = nodeArray[i];

        if ((node.url === null || node.url === undefined) && // just in case some goober names a bookmark 'Bookmarks Bar'
            node.title.toLowerCase() === folderName.toLowerCase()) {
            return node.id;
        }

        if (node.children != null) {
            nodeArray = nodeArray.concat(node.children);
        }
    }

    return null; // couldn't find it. put in "Other Bookmarks" instead
}

function bookmarkFilteredTabs(nodeArray) {
    bookmarkBarId = getBookmarkFolderId(nodeArray, "Bookmarks Bar");
    var dateString = getFormattedDate( new Date() );
    chrome.bookmarks.create( {
        "parentId" : bookmarkBarId,
        "title"    : BOOKMARK_FOLDER_NAME + " " + dateString
    }, addBookmarksToFolder );
}

function addBookmarksToFolder(bookmarkNode) {
    var folderId = bookmarkNode.id;
    for (var j = 0; j < filteredTabs.length; j++) {
        chrome.bookmarks.create( {
            "parentId" : folderId,
            "title"    : filteredTabs[j].title,
            "url"      : filteredTabs[j].url
        });
    }

    setFeedbackText(filteredTabs.length + " tabs bookmarked");
}

function padIfLtTen(n) {
    return (n > 9) ? n : "0" + n;
}

function getFormattedDate(d) {
    if ( !(d instanceof Date) ) {
        d = new Date();
    }

    var str = d.getFullYear() + "-" +
        padIfLtTen( d.getMonth()+1 ) + "-" + /* months go from 0-11 */
        padIfLtTen( d.getDate() );
    str += " " +
        padIfLtTen( d.getHours() ) + ":" +
        padIfLtTen( d.getMinutes() ) + ":" +
        padIfLtTen( d.getSeconds() );

    return str;
}

function getIdList(nodeArray) {
    var ids = Array();
    for (var i = 0; i < nodeArray.length; i++) {
        ids.push( nodeArray[i].id );
    }
    return ids;
}

function moveTabsToWindow(window) {
    chrome.tabs.move( getIdList(filteredTabs), { "windowId": window.id, "index": -1 });
    chrome.windows.update( window.id, { "focused": true });
}

function discardTabs() {
    var tabIds = getIdList(filteredTabs);
    for (var i = 0; i < tabIds.length; i++) {
        chrome.tabs.get(tabIds[i], function(tab) {
            if (!tab.discarded) {
                chrome.tabs.discard(tab.id);
            }
        });
    }
    updateTabList();
    setFeedbackText(filteredTabs.length + " tabs discarded");
}

function closeTabs() {
    chrome.tabs.remove( getIdList(filteredTabs), function() {
        $("filter").raw().value = "";
        $("filter").raw().focus();
        updateTabList();
        setFeedbackText(filteredTabs.length + " tabs closed");
    });
}

/* listeners */
document.addEventListener("DOMContentLoaded", function() {
    var defaultURLs = localStorage.defaultURLs || "false";
    $("useURLs").raw().checked = ( defaultURLs.toLowerCase().indexOf("true") === 0 );

    $("filter").on("keyup", updateTabList);
    $("useURLs").on("click", updateTabList);
    $("onlyCurrentWindow").on("click", updateTabList);
    $("hideDiscarded").on("click", updateTabList);
    updateTabList();

    $("bookmark").on("click", function() {
        if (filteredTabs.length === 0) { return; }
        chrome.bookmarks.getTree(bookmarkFilteredTabs);
    });

    $("move").on("click", function() {
        if (filteredTabs.length === 0) { return; }
        chrome.windows.create( {
            "focused" : false,
            "tabId"   : filteredTabs[0].id
        }, moveTabsToWindow);
    });

    $("discard").on("click", function() {
        if (filteredTabs.length === 0) { return; }
        discardTabs();
    })

    $("close").on("click", function() {
        if (filteredTabs.length === 0) { return; }
        closeTabs();
    });

    window.setTimeout( function() {
        $("filter").raw().focus();
    }, 500 );
});
