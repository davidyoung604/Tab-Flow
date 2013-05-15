/********************************************************
 * Project   : Tab Flow
 * Author    : David Young
 * Date      : May 5, 2013
 * Copyright : All rights reserved.
 * Licence   : Feel free to make changes for your own use,
 *             but you are not permitted to release anything
 *             based on my code in whole or in part.
 ********************************************************/
 
document.addEventListener("DOMContentLoaded", function() {
    var showBadge = localStorage.showBadge || "true";
    var defaultURLs = localStorage.defaultURLs || "false";
    var showBadgeBox = document.getElementById("showBadge");
    var defaultURLsBox = document.getElementById("defaultURLs");
    
    showBadgeBox.checked = (showBadge.toLowerCase().indexOf("true") === 0);
    defaultURLsBox.checked = (defaultURLs.toLowerCase().indexOf("true") === 0);
    
    document.getElementById("saveButton").addEventListener("click", function () {
        localStorage.showBadge = showBadgeBox.checked;
        localStorage.defaultURLs = defaultURLsBox.checked;
    } );
});
