const fs = require('fs');

let content = fs.readFileSync('src/actions/payment.ts', 'utf8');

content = content.replace(
  "http_status: transaction.http_status || null,",
  "http_status: transaction.http_status ? Number(transaction.http_status) : null,"
);

fs.writeFileSync('src/actions/payment.ts', content);
console.log('payment.ts http_status type error fixed');
