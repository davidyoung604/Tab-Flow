/********************************************************
 * Project   : Tab Flow
 * Author    : David Young
 * Date      : May 1, 2013
 * Copyright : All rights reserved.
 * Licence   : Feel free to make changes for your own use,
 *             but you are not permitted to release anything
 *             based on my code in whole or in part.
 ********************************************************/

var tabCount = 0;

function printBadge(badgeText) {
    var showBadge = localStorage.showBadge || "true";
    if ( showBadge.toLowerCase().indexOf("true") !== 0 ) {
        badgeText = "";
    }

    chrome.browserAction.setBadgeText( { "text": badgeText } );
}

function tallyTabs() {
    chrome.windows.getAll( { "populate": true }, function (windows) {
        tabCount = windows.reduce(
            (count, window) => count + window.tabs.length,
            0
        );
        printBadge("" + tabCount);
    });
}

tallyTabs();

chrome.tabs.onCreated.addListener( function (a) {
    tallyTabs();
} );
chrome.tabs.onRemoved.addListener( function (a, b) {
    tallyTabs();
} );
