const Alpaca = require('@alpacahq/alpaca-trade-api');

const API_KEY = 'PKD67AIFH0RUDGUD4EV9';
const API_SECRET = '6Sw1dMpmxz3PD969Rukwub77DhPXzKmjNPgIjxcS';

const alpaca = new Alpaca({
  keyId: API_KEY,
  secretKey: API_SECRET,
  paper: true
});

(async () => {
  try {
    const account = await alpaca.getAccount();
    console.log('Account status:', account.status);

    const orders = await alpaca.getOrders({ status: 'all' });
    const orderCount = orders.length;

    let notional = 1;
    if (orderCount > 20) notional = 4;
    else if (orderCount > 10) notional = 2;

    const lastTrade = await alpaca.getLatestCryptoTrade('BTCUSD', { exchange: 'CBSE' });
    const latestPrice = lastTrade?.Trade?.p || 0;
    const tpPrice = parseFloat((latestPrice * 1.002).toFixed(6));

    await alpaca.createOrder({
      symbol: 'BTCUSD',
      notional: notional.toString(),
      side: 'buy',
      type: 'market',
      time_in_force: 'day',
      order_class: 'bracket',
      take_profit: { limit_price: tpPrice }
    });

    console.log('Bracket order placed.');
  } catch (err) {
    console.error(err);
  }
})();
