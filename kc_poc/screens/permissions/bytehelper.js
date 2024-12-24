class BytesHelper {
    static CHAR_HASH_TAG = 0x23;
    static CHAR_LESS_THAN = 0x3c;
    static CHAR_MORE_THAN = 0x3e;
    static CHAR_ONE = 0x01;
    static CHAR_TWO = 0x02;
    static CHAR_ZERO = 0x00;
  
    static mergeLsb(array) {
      const reversed = this.reverseArray(array);
      let result = 0;
      for (let i = 0; i < reversed.length; i++) {
        result |= reversed[i] << (8 * i);
      }
      return result;
    }
  
    static convertToOutput(array) {
      const list = [];
      list.push(this.CHAR_LESS_THAN);
      for (const byte of array) {
        if (byte === this.CHAR_HASH_TAG) {
          list.push(this.CHAR_HASH_TAG, this.CHAR_TWO);
        } else if (byte === this.CHAR_LESS_THAN) {
          list.push(this.CHAR_HASH_TAG, this.CHAR_ZERO);
        } else if (byte === this.CHAR_MORE_THAN) {
          list.push(this.CHAR_HASH_TAG, this.CHAR_ONE);
        } else {
          list.push(byte);
        }
      }
      list.push(this.CHAR_MORE_THAN);
      return Uint8Array.from(list);
    }
  
    static convertFromOutput(array) {
      const list = [];
      let skipNext = false;
      for (let i = 0; i < array.length; i++) {
        if (skipNext) {
          skipNext = false;
          continue;
        }
        if (array[i] === this.CHAR_HASH_TAG) {
          list.push(this.CHAR_MORE_THAN);
          skipNext = true;
          continue;
        }
        if (array[i] === this.CHAR_LESS_THAN || array[i] === this.CHAR_MORE_THAN) {
          continue;
        }
        list.push(array[i]);
      }
      return Uint8Array.from(list);
    }
  
    static reverseArray(array) {
      return array.slice().reverse();
    }
  }
  
export default BytesHelper;