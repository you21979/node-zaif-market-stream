var MarketStream = require("..").MarketStream;
var pair = 'btc_jpy';

var ms = new MarketStream(pair);
ms.on("depth", function(now, old){
    console.log(now);
})
ms.on("lastprice", function(now, old){
    console.log(now);
})
ms.on("trades", function(now, old){
    console.log(now.map(function(v){return [v.tid, v.price, v.amount]}));
    console.log(old.map(function(v){return [v.tid, v.price, v.amount]}));
})
ms.start().then(function(){
})
