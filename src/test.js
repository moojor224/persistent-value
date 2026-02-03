import { persistValue } from "./index";

async function run() {
    // top-level await might not be supported
    const test = await persistValue({
        acquireMessage: "",
        acquireValue: () => {
            return prompt("input value");
        },
        key: "test",
        optional: true
    });

    console.log(test.getKey());
    console.log(test.isOptional());
    console.log(test.get());
    console.log(test.has());
    console.log(test.set("new value"));
    console.log(test.get());
    console.log(test.has());
    return test;
}
run();
