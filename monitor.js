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

console.log("");
console.log("┌──────────────────────────────────────────────────────────────────────────────────┐");
console.log("│                                                                                  │");
console.log("│    N A V C O I N                                                                 │");
console.log("│    B L O C K                                                                     │");
console.log("│    M O N I T O R                                                                 │");
console.log("│                             https://www.github.com/aguycalled/blockmonitor       │");
console.log("│    v0.1                     alex v. <alex@encrypt-s.com>                         │");
console.log("│                                                                                  │");
console.log("└──────────────────────────────────────────────────────────────────────────────────┘");

console.log("");
console.log("~~~INFO~~~ NavCoin daemon should be run with -zmqpubrawblock=tcp://127.0.0.1:"+port);
console.log("~~~STAT~~~ Waiting for blocks...");
console.log("");

var networkTime = [];
var localTime = [];

var tpsMax = nTransactions = accTime = lastCheck = 0;

var avgMultiplier = 1;

setInterval(() => {
  var nowTime = parseInt(new Date().getTime() / 1000);
  if (localTime.length > 0 && (nowTime - localTime[localTime.length -1]) >= 1 &&
     (nowTime - lastCheck) >= 1) {
     process.stdout.write(printf("\r~~~INFO~~~ Last block was %s seconds ago.", nowTime - localTime[localTime.length -1]));
     lastCheck = nowTime;
  }
}, 500);


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
    console.log("                                                                           ");
    console.log("~~~INFO~~~ NEW BLOCK");
    console.log("");
    console.log(printf("┌──────────────────────────────────────────────────────────────────────────────────┐"));
    console.log(printf("│ Hash: %64s           │", block.header.hash));   
    console.log(printf("│──────────────────────────────────────────────────────────────────────────────────│"));
    console.log(printf("│ Version: %31s │ Difficulty: %25s │",
       block.header.version.toString(16), block.header.bits));   
    console.log(printf("│ Transactions: %26s │ Size:  %28sKb │",
       block.transactions.length, parseInt(message.length*10/1024)/10));   
    console.log(printf("│ `Per second: %27s │ Mined by: %27s │",
       tpsThisBlock, block.transactions.length > 1 ? new Transaction(block.transactions[1]).strdzeel.split(";")[0] : ""));
    console.log(printf("│ `Max recorded: %25s │ With version: %23s │",
       tpsMax, block.transactions.length > 1 ? new Transaction(block.transactions[1]).strdzeel.split(";")[1] : ""));
    console.log(printf("│ `Average: %30s │                                       │", parseInt(nTransactions*10/accTime)/10));
    console.log(printf("│──────────────────────────────────────────────────────────────────────────────────│"));
    console.log(printf("│ Network time: %26s │ Real time: %26s │", hrt(new Date(block.header.time * 1000)), hrt(new Date())));
    console.log(printf("│ Block time: %28d │     %33d │", diffPrevN, diffPrevL));

    localTime.push(parseInt(new Date().getTime() / 1000));
    networkTime.push(parseInt(block.header.time));
    avgMultiplier = Math.max(10, parseInt(networkTime.length / 10));

    console.log(printf("│ Avg last %5s %25s │     %33s │",
       0.5*avgMultiplier +":", avgdiff(networkTime, 0.5*avgMultiplier), avgdiff(localTime, 0.5*avgMultiplier)));
    console.log(printf("│ Avg last %5s %25s │     %33s │",
       1*avgMultiplier +":", avgdiff(networkTime, 1*avgMultiplier), avgdiff(localTime, 1*avgMultiplier)));
    console.log(printf("│ Avg last %5s %25s │     %33s │",
       5*avgMultiplier +":", avgdiff(networkTime, 5*avgMultiplier), avgdiff(localTime, 5*avgMultiplier)));
    console.log(printf("└──────────────────────────────────────────────────────────────────────────────────┘"));
    console.log();
  }
});

function avgdiff(array, n) {
  if(array.length - 1 < n) return "N/A";
  var newArray = [];
  for (var i = 1; i < array.length; i++) {
    newArray.push(array[i] - array[i-1]);
  }
  var sum = newArray.slice().slice(-n).reduce((a, b) => { return a + b; });
  var avg = sum / n;
  return parseInt(avg);
}
