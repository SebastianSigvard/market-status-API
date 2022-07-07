/**
 * Shuffles array
 * @param {Array} array Array to be shuffled
 * @return {Array} Shuffled array
 **/
export function shuffle(array) {
  let currentIndex = array.length; let randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
};

// eslint-disable-next-line
export const initialBid = [{"quantity":"0.19157204","rate":"29954.31800000"},{"quantity":"0.08209000","rate":"29952.82100000"},{"quantity":"0.19500000","rate":"29952.82000000"},{"quantity":"0.10012979","rate":"29949.20100000"},{"quantity":"0.01600000","rate":"29945.88400000"},{"quantity":"0.08084000","rate":"29945.87200000"},{"quantity":"0.16680000","rate":"29945.72700000"},{"quantity":"0.23810355","rate":"29941.28200000"},{"quantity":"0.10014263","rate":"29939.44600000"},{"quantity":"0.10014370","rate":"29939.01800000"},{"quantity":"0.00200000","rate":"29936.90800000"},{"quantity":"0.16690744","rate":"29927.01500000"},{"quantity":"0.16694763","rate":"29922.26100000"},{"quantity":"0.66139631","rate":"29918.78700000"},{"quantity":"0.00988520","rate":"29915.44200000"},{"quantity":"0.34600000","rate":"29912.70000000"},{"quantity":"0.92100000","rate":"29890.30000000"},{"quantity":"0.00653655","rate":"29885.52800000"},{"quantity":"0.00989015","rate":"29885.52700000"},{"quantity":"0.01634409","rate":"29867.80100000"},{"quantity":"1.71500000","rate":"29867.80000000"},{"quantity":"0.04248755","rate":"29855.64200000"},{"quantity":"0.00989510","rate":"29855.64100000"},{"quantity":"0.00990005","rate":"29825.78600000"},{"quantity":"0.00990500","rate":"29795.96000000"}];
// eslint-disable-next-line
export const initialAsk = [{"quantity":"0.19500000","rate":"29964.38100000"},{"quantity":"0.16680000","rate":"29965.95800000"},{"quantity":"0.01600000","rate":"29970.49500000"},{"quantity":"0.24536529","rate":"29970.49600000"},{"quantity":"0.08325000","rate":"29970.50000000"},{"quantity":"0.10013719","rate":"29971.15200000"},{"quantity":"0.08100000","rate":"29971.28900000"},{"quantity":"0.26007686","rate":"29971.30100000"},{"quantity":"0.10012682","rate":"29974.31600000"},{"quantity":"0.00986545","rate":"29975.33300000"},{"quantity":"0.10011991","rate":"29976.33800000"},{"quantity":"0.00400000","rate":"29978.85000000"},{"quantity":"0.16690616","rate":"29980.64400000"},{"quantity":"0.34600000","rate":"29981.30000000"},{"quantity":"0.16687803","rate":"29986.25200000"},{"quantity":"0.92100000","rate":"30003.80000000"},{"quantity":"0.00985559","rate":"30005.30900000"},{"quantity":"1.71500000","rate":"30012.29200000"},{"quantity":"0.31059745","rate":"30029.39200000"},{"quantity":"0.06705000","rate":"30034.54600000"},{"quantity":"0.00985067","rate":"30035.31400000"},{"quantity":"0.12344733","rate":"30065.34800000"},{"quantity":"0.00984576","rate":"30065.34900000"},{"quantity":"0.22920401","rate":"30087.89000000"},{"quantity":"12.02700000","rate":"30087.89100000"}];
