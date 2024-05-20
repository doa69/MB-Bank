# MB (Vietnamese Bank) API THing
## Installation
``
npm i mbank-api@latest
``
## Example Usage
```js
(async () => {
    const { MB } = require("mbank-api");
    
    const mb = new MB({ username: "phone_number",password:"password" });

    console.log(await mb.getHistory())
})()
```
