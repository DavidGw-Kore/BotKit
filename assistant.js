#!/usr/bin/env node
const OpenAI = require('openai');
const openai = new OpenAI();

const DELAY_TIME = 3000;
const MAX_ATTEMPTS = 25;

const sleep = async (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
};

async function questionAnswer(assistantId, question) {
    console.log(`QUESTION: ${question}`);
    const thread = await openai.beta.threads.create();
    const secondMsg = await openai.beta.threads.messages.create(
        thread.id,
        {
            role: "user",
            content: question
        }
    );
    const run = await openai.beta.threads.runs.create(
        thread.id,
        {
            assistant_id: assistantId
        }
    );
    await retrieveMessages(thread.id, run.id);
    const messages = await openai.beta.threads.messages.list(
        thread.id
    );
    console.log(`ANSWER: `);
    outputMessages(messages.data);
}


async function retrieveMessages(threadId, runId) {
    for (let i = MAX_ATTEMPTS; i > 0; i--) {
//        console.log(`run: ${runId}, thread: ${threadId}`);
        process.stdout.write('.');
        let result = await openai.beta.threads.runs.retrieve(
            threadId,
            runId
        );
//        console.log(`result: ${JSON.stringify(result, null, 4)}`);
        if (result.status === 'completed') {
            break;
        }
        await sleep(DELAY_TIME);
    }
    console.log();
}

function outputMessages(data) {
    for (const d of data) {
        if (d.role === 'user') {
            continue;
        }
//        console.log(JSON.stringify(d, null, 4));
        console.log(d.content[0].text.value);
        console.log(JSON.stringify(d));
    }
}

async function main() {
    const assistant = await openai.beta.assistants.retrieve(
        "asst_WUVL4Z7rrhaCwCfpJotzvlwd"
    );

    // await questionAnswer(assistant.id, "What is the difference in the series 22 and 98 exit devices?");
    // await questionAnswer(assistant.id, "What finishes do the 22 series exit devices come in?")
    // await questionAnswer(assistant.id, "What finishes do the 98 series exit devices come in?")
    // await questionAnswer(assistant.id, "What trim options are available on the series 22?");
//    await questionAnswer(assistant.id, "What is the part number for a Panic Bar? It’s a 98-series device with exit only trim, has no cables or rods attached to it, should be in chrome finish, and is for a four-foot door.");
//    await questionAnswer(assistant.id, "What is the Warranty on a Von Duprin 98 Device?");
    await questionAnswer(assistant.id, "Maximum length of a concealed vertical cable");
    await questionAnswer(assistant.id, "What is the Warranty on a Von Duprin 98 Device?");

}

main();
