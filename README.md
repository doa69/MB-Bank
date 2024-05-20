# MB (Vietnamese Bank) API THing
## Installation
``
npm i mbbank-services@latest
``
## Example Usage
```js
(async () => {
    const { MB } = require("mbbank-services");
    
    const mb = new MB({ username: "phone_number",password:"password" });

    console.log(await mb.getHistory())
})()
```
