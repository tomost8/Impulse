const { handler } = require("./dist/index.js");
const event = require("./event.json");

(async () => {
  const response = await handler(event);
  console.log("Lambda Response:", JSON.stringify(response, null, 2));
})();
