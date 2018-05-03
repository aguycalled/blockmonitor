const zmq = require('zeromq')
  , bitcore = require('bitcore-lib') // npm install encrypt-s/bitcore-lib
  , clock = require('human-readable-time')
  , printf = require('printf')
  , sock = zmq.socket('sub')
  , hrt = new clock('%D%/%M%/%YY% %hh%:%mm%:%ss%')
  , Block = bitcore.Block
  , Transaction = bitcore.Transaction;

const port = 30000;

sock.connect('tcp://127.0.0.1:'+port);
sock.subscribe('rawblock');
sock.subscribe('hashblock');

console.log("¡¡¡''' Subscribed to port "+port);
console.log("¡¡¡''' NavCoin daemon should be launched with -zmqpubrawblock=tcp://127.0.0.1:"+port);
console.log("¡¡¡''' Waiting for blocks...");

var networkTime = [];
var localTime = [];

var tpsMax = 0;
var nTransactions = 0;
var accTime = 0;

sock.on('message', (topic, message) => {
  if(topic == 'rawblock') {
    var block = new Block(message).toObject();

    var tpsThisBlock = 0;

    var diffPrevL = 0;
    if(localTime.length > 0) {
      nTransactions += block.transactions.length;
      diffPrevL = (new Date().getTime() / 1000) - localTime[localTime.length - 1];
      accTime += diffPrevL;
      tpsThisBlock = parseInt(block.transactions.length*10/diffPrevL)/10;
    }

    var diffPrevN = 0;
    if(networkTime.length > 0) {
      diffPrevN = block.header.time - networkTime[networkTime.length - 1];
    }

    if(tpsThisBlock > tpsMax) {
      tpsMax = tpsThisBlock;
    }

    console.log(printf("¡¡¡''' -------------------------------------------------------------------------------- '''¡¡¡"));
    console.log(printf("¡¡¡''' Received Block: %62s '''¡¡¡", block.header.hash));   
    console.log(printf("¡¡¡''' Version: %8s  Size: %6sKb   Difficulty: %9s   Transactions: %6s '''¡¡¡",
       block.header.version.toString(16), parseInt(message.length*10/1024)/10, block.header.bits, block.transactions.length));   
    console.log(printf("¡¡¡''' Tps: %6s (Max: %6s Avg: %6s)     Mined by node id: %20s '''¡¡¡", 
       tpsThisBlock, tpsMax, parseInt(nTransactions*10/accTime)/10, new Transaction(block.transactions[0]).strdzeel));
    console.log(printf("¡¡¡''' -------------------------------------------------------------------------------- '''¡¡¡"));
    console.log(printf("¡¡¡''' Network time: %22s '''¡¡¡''' Real time: %22s '''¡¡¡", hrt(new Date(block.header.time * 1000)), hrt(new Date())));
    console.log(printf("¡¡¡''' Block time: %24d '''¡¡¡''' %33d '''¡¡¡", diffPrevN, diffPrevL));

    localTime.push(parseInt(new Date().getTime() / 1000));
    networkTime.push(parseInt(block.header.time));

    console.log(printf("¡¡¡''' Avg last 5: %24d '''¡¡¡''' %33d '''¡¡¡", avgdiff(networkTime, 5), avgdiff(localTime, 5)));
    console.log(printf("¡¡¡''' Avg last 25: %23d '''¡¡¡''' %33d '''¡¡¡", avgdiff(networkTime, 25), avgdiff(localTime, 25)));
    console.log(printf("¡¡¡''' Avg last 50: %23d '''¡¡¡''' %33d '''¡¡¡", avgdiff(networkTime, 50), avgdiff(localTime, 50)));
    console.log(printf("¡¡¡''' -------------------------------------------------------------------------------- '''¡¡¡"));
    console.log();
  }
});

function avgdiff(array, n) {
  if(array.length - 1 < n) return 0;
  var newArray = [];
  for (var i = 1; i < array.length; i++) {
    newArray.push(array[i] - array[i-1]);
  }
  var sum = newArray.slice().slice(-n).reduce((a, b) => { return a + b; });
  var avg = sum / n;
  return parseInt(avg);
}
