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
