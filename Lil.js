/********************************************************
 * Project   : Lil.js
 * Author    : David Young
 * Date      : May 16, 2013
 * Homepage  : github.com/davidyoung604/Lil.js
 * Copyright : All rights reserved.
 * Licence   : Free for personal or business use as long as
 *             you keep the attributions intact and do not
 *             charge for it.
 ********************************************************/

var Lil = {
	version: "0.1.1",
    init: function(id) {
        self = Lil;
        self.selector = id;
        self.target = document.getElementById(id);
        return self;
    },

    raw: function() {
        return self.target;
    },
    
    on: function(event, func) {
        self.target.addEventListener(event, func);
    }
};

window.$ = function(id) {
    return new Lil.init(id);
};
