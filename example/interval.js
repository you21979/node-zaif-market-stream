var MarketStream = require("..").MarketStream;
var pair = 'btc_jpy';

var ms = new MarketStream(pair);
ms.start().then(function(){
    var w = "";
    var update = function(){
        if(w !== ms.lastUpdate()){
            console.log(ms.lastUpdate())
            console.log(ms.lastPrice())
            w = ms.lastUpdate();
        }
        setTimeout(update, 1000);
    }
    update();
})
