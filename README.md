# MB (Vietnamese Bank) API THing
## Installation
``
npm i @doa69/mbbank@latest
``
## Example Usage
```js
(async () => {
    const { MB } = require("@doa69/mbbank");
    
    const mb = new MB({ username: "phone_number",password:"password" });

    console.log(await mb.getHistory())
})()
```
