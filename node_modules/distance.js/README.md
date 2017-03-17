# distance.js
_NodeJs module to calc distances between two points using coords. Originally cloned from https://gist.github.com/1604972. Response is in km_

## Installation

``` js
npm install distance.js --save
```

## Usage

``` js
var distance = require('distance.js');

var start = {
  latitude: Coords,
  longitude: Coords
}
var end = {
  latitude: Coords,
  longitude: Coords
}

var distance = distance.getDistance(start, end) // Decimals is 2 by default.
var distance = distance.getDistance(start, end, 3) // Returns 3 decimals
console.log("Distance is: " + distance)

```
