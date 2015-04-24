var events = require('events');
var util = require('util');
var moment = require('moment');
var zaif = require('zaif.jp');
var apiv1 = zaif.PublicApi;

var createMarketStream = function(pair){
    var MAX = 20;
    return apiv1.depth(pair).then(function(v){
        return {
            timestamp:'',
            currency_pair: pair,
            last_price: {action:'', price:0},
            asks: v.asks.slice(0, MAX),
            bids: v.bids.slice(0, MAX),
            trades : [],
        }
    }).then(function(v){
        return apiv1.trades(pair).then(function(trades){
            v.trades = trades.slice(0, MAX);
            if(v.trades.length > 0){
                v.timestamp = moment().format("YYYY-MM-DD HH:mm:ss.000000");
                v.last_price.action = v.trades[0].trade_type;
                v.last_price.price = v.trades[0].price;
            }
            return v;
        })
    })
}

var MarketStream = module.exports = function(pair){
    events.EventEmitter.call(this);
    this.pair = pair;
    this.conn = null;
    this.data = {};
}

util.inherits(MarketStream, events.EventEmitter);

var compareDepth = function(now, old){
    if( JSON.stringify(now.asks) === JSON.stringify(old.asks)
     && JSON.stringify(now.bids) === JSON.stringify(old.bids)
    ){
        return true;
    }
    return false;
}
var compareLastPrice = function(now, old){
    if( JSON.stringify(now.last_price) === JSON.stringify(old.last_price) ){
        return true;
    }
    return false;
}
var compareTrades = function(now, old){
    if( JSON.stringify(now.trades) === JSON.stringify(old.trades) ){
        return true;
    }
    return false;
}

var updateEvent = function(self, old){
    var f = {
        depth : true,
        lastprice : true,
        trades : true,
    }
    var now = self.getData();
    if(old){
        if(compareDepth(now, old)){
            f.depth = false;
        }
        if(compareLastPrice(now, old)){
            f.lastprice = false;
        }
        if(compareTrades(now, old)){
            f.trades = false;
        }
    }
    var createDepth = function(data){
        return {
            asks : data.asks,
            bids : data.bids,
        }
    }
    if(f.depth)self.emit('depth', createDepth(now), createDepth(old ? old : {asks:[], bids:[]}) );
    if(f.lastprice)self.emit('lastprice', self.lastPrice(), old ? old.last_price : 0);
    if(f.trades)self.emit('trades', self.trades(), old ? old.trades : []);
}

MarketStream.prototype.start = function(){
    var self = this;
    return createMarketStream(self.pair).then(function(data){
        self.data = data;
        self.conn = zaif.createStreamApi(self.pair, function(data){
            var old = self.data;
            self.data = data;
            updateEvent(self, old);
        })
        updateEvent(self, null);
        //self.conn.debuglog = function(x){console.log(x)};
    })
}

MarketStream.prototype.stop = function(){
    if(this.conn){
        this.conn.close();
        this.conn = null;
    }
}

MarketStream.prototype.isReady = function(){
    if(this.conn){
        return true;
    }
    return false
}

MarketStream.prototype.getData = function(){
    return this.data;
}

MarketStream.prototype.depth = function(){
    return {
        bids:this.getData().bids,
        asks:this.getData().asks,
    };
}

MarketStream.prototype.trades = function(){
    return this.getData().trades;
}

MarketStream.prototype.lastUpdate = function(){
    return this.getData().timestamp;
}

MarketStream.prototype.lastPrice = function(){
    return this.getData().last_price;
}

