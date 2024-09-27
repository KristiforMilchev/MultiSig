class FeeServiceMock {
  getFeeInEthAndUsd() {
    const feeInWei = 900000000000;
    const usd = 100;

    return [feeInWei, usd];
  }
}

module.exports = FeeServiceMock;
