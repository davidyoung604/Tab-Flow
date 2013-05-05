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
    chrome.browserAction.setBadgeText( { "text": badgeText } );
}

chrome.windows.getAll( { "populate": true }, function (windows) {
    for (i = 0; i < windows.length; i++) {
        tabCount += windows[i].tabs.length;
    }
    
    printBadge("" + tabCount);
} );

chrome.tabs.onCreated.addListener( function (a) {
    tabCount++;
    printBadge("" + tabCount);
} );
chrome.tabs.onRemoved.addListener( function (a, b) {
    tabCount--;
    printBadge("" + tabCount);
} );
