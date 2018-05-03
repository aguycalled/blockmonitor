const zmq = require('zeromq')
  , bitcore = require('bitcore-lib') // npm install encrypt-s/bitcore-lib
  , hrt = require('human-readable-time')
  , printf = require('printf')
  , sock = zmq.socket('sub')
  , Block = bitcore.Block;

const port = 30000;

sock.connect('tcp://127.0.0.1:'+port);
sock.subscribe('rawblock');
sock.subscribe('hashblock');

console.log("¡¡¡''' Subscribed to port "+port);
console.log("¡¡¡''' NavCoin daemon should be launched with -zmqpubrawblock=tcp://127.0.0.1:"+port);
console.log("¡¡¡''' Waiting for blocks...");

var networkTime = [];
var localTime = [];

sock.on('message', (topic, message) => {
  if(topic == 'rawblock') {
    var block = new Block(message).toObject().header;
    console.log(printf("¡¡¡''' Received Block: %50s '''¡¡¡", block.hash));   
    console.log(printf("¡¡¡''' Network time: %15s '''¡¡¡''' Real time: %15s '''¡¡¡", hrt(new Date(block.time)), hrt(new Date())));
    var diffPrevL = 0;
    if(localTime.length > 0) {
      diffPrevL = (new Date().getTime() / 1000) - localTime[localTime.length - 1];
    }
    var diffPrevN = 0;
    if(networkTime.length > 0) {
      diffPrevN = block.time - networkTime[networkTime.length - 1];
    }
    console.log(printf("¡¡¡''' Diff prev: %19d '''¡¡¡''' %27d '''¡¡¡", diffPrevN, diffPrevL));
    localTime.push(parseInt(new Date().getTime() / 1000));
    networkTime.push(parseInt(block.time));
    console.log(printf("¡¡¡''' Avg last 5: %18d '''¡¡¡''' %27d '''¡¡¡", avgdiff(networkTime, 5), avgdiff(localTime, 5)));
    console.log(printf("¡¡¡''' Avg last 25: %17d '''¡¡¡''' %27d '''¡¡¡", avgdiff(networkTime, 25), avgdiff(localTime, 25)));
    console.log(printf("¡¡¡''' Avg last 50: %17d '''¡¡¡''' %27d '''¡¡¡", avgdiff(networkTime, 50), avgdiff(localTime, 50)));
  } else if(topic = 'hashblock') {
  }
});

function avgdiff(array, n) {
  if(array.length - 1 < n) return 0;
  var newArray = [];
  for (var i = 1; i < array.length; i++) {
    newArray.push(array[i] - array[i-1]);
  }
  var sum = newArray.slice(-n).reduce((a, b) => { return a + b; });
  var avg = sum / n;
  return parseInt(avg);
}
