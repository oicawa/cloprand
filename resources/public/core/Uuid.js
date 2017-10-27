define(function (require) {
  /**
   * Returns unsigned random integer ranging from zero to max.
   * @access protected
   * @param int max
   * @return int
   * @todo The randomness should be improved (see http://www.ietf.org/rfc/rfc1750.txt).
   */
  function rand(max) {
    var B32 = 4294967296; // 2^32
    if (max <= B32) {
        return Math.floor(Math.random() * max);
    } else {
        var d0 = Math.floor(Math.random() * B32);
        var d1 = Math.floor(Math.random() * Math.floor(max / B32));
        return d0 + d1 * B32;
    }
  }
  
  
  /**
   * Convert integer to zero-padded hex string.
   * @access protected
   * @param int n
   * @param int length
   * @return string
   */
  function int2hex(n, length) {
    var hex = n.toString(16);
    while (hex.length < length) {
        hex = '0' + hex;
    }
    return hex;
  }
  
  /*
   * Generator state, used when generating version 1.
   * @access private
   * @var object
   */
  var state = null;
  
  return {
    NULL : "00000000-0000-0000-0000-000000000000",
    is_uuid : function (value) {
      if (typeof value != "string") {
        return false;
      }
      var REGEXP = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
      return REGEXP.test(value.toLowerCase());
    },
    version1 : function () {
      var timestamp = new Date() - Date.UTC(1582, 9, 15);
      
      if (state == null) {
        // initialize state
        state = {
          timestamp: timestamp,
          sequence: rand(16384), //16384 = 2^14
          node: int2hex(rand(256) | 1, 2) + int2hex(rand(1099511627776), 10) // 1099511627776 = 2^40
        };
      } else {
        // update state
        if (timestamp <= state.timestamp) {
          state.sequence++;
        } else {
          state.timestamp = timestamp;
        }
      }
      
      var ts  = int2hex(timestamp * 10000, 15); // overflowing though it is no problem
      var seq = 32768 | (16383 & state.sequence); // make initial 2 bits '10'
      
      return [
        ts.substr(7),
        ts.substr(3, 4),
        '1' + ts.substr(0, 3),
        int2hex(seq, 4),
        state.node
      ].join('-');
    },
    version4 : function () {
      function genHexFromDigit(digit) {
        var max = Math.pow(2, digit * 4)
        return int2hex(rand(max), digit);
      }
      return [
          genHexFromDigit(8),
          genHexFromDigit(4),
          '4' + genHexFromDigit(3),
          int2hex(8 | rand(4), 1) + genHexFromDigit(3),
          genHexFromDigit(12)
      ].join('-');
    }
  };
});
