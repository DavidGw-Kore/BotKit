#!/usr/bin/env node
const OpenAI = require('openai');
const openai = new OpenAI();

const DELAY_TIME = 3000;
const MAX_ATTEMPTS = 25;

const sleep = async (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
};

async function questionAnswer(assistantId, query, context) {
    console.log(`QUERY: ${query}`);
    const thread = await openai.beta.threads.create();
    const message = await openai.beta.threads.messages.create(
        thread.id,
        {
            role: "user",
            content: query
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
    const assistantResponse = outputMessages(messages.data);
    console.log(JSON.stringify(assistantResponse, null, 4));
    context.assistantResponse = assistantResponse;
}


async function retrieveMessages(threadId, runId) {
    for (let i = MAX_ATTEMPTS; i > 0; i--) {
        process.stdout.write('.');
        let result = await openai.beta.threads.runs.retrieve(
            threadId,
            runId
        );
        if (result.status === 'completed') {
            break;
        }
        await sleep(DELAY_TIME);
    }
    console.log();
}

function outputMessages(data) {
    const answer = []
    for (const d of data) {
        if (d.role === 'user') {
            continue;
        }
        console.log(d.content[0].text.value);
        console.log(JSON.stringify(d));
	answer.push(d);
    }
    return answer;
}

async function queryAssistant(context) {
    const assistantId = context.session.BotUserSession.assistantId;
    console.log(`assistantId: ${assistantId}`);
    const assistant = await openai.beta.assistants.retrieve(assistantId);
    await questionAnswer(assistant.id, context.query, context);
}

module.exports = {
    queryAssistant
};
