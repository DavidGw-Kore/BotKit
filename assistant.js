#!/usr/bin/env node
const OpenAI = require('openai');
const openai = new OpenAI();

const DELAY_TIME = 5000;
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

/**
 *
 */
async function messagesCreate(context) {
    const query = context.query;
    console.log(`query: ${query}`);

    const assistantId = context.session.BotUserSession.assistantId;

    const thread = await openai.beta.threads.create();
    context.session.BotUserSession.threadId = thread.id;
    console.log(`context.session.BotUserSession.threadId: ${context.session.BotUserSession.threadId}`);

    const message = await openai.beta.threads.messages.create(thread.id, {role: "user", content: query});

    const run = await openai.beta.threads.runs.create(thread.id, {assistant_id: assistantId});
    context.session.BotUserSession.runId = run.id;
    console.log(`context.session.BotUserSession.runId: ${context.session.BotUserSession.runId}`);
}

/**
 *
 */
async function messagesReady(context) {
   const threadId = context.session.BotUserSession.threadId;
   const runId = context.session.BotUserSession.runId;
   console.log(`threadId: ${threadId}, runId: ${runId}`);

   await sleep(DELAY_TIME);

   const result = await openai.beta.threads.runs.retrieve(threadId, runId);
   context.status = result.status;
}

/**
 *
 */
async function messagesFetch(context) {
    const threadId = context.session.BotUserSession.threadId;
    console.log(`threadId: ${threadId}`);
   
    const messages = await openai.beta.threads.messages.list(threadId);
    console.log(`data: ${JSON.stringify(messages.data)}`);

    const assistantResponse = outputMessages(messages.data);
    console.log(JSON.stringify(assistantResponse, null, 4));

    context.assistantResponse = assistantResponse.join();
}


async function retrieveMessages(threadId, runId) {
    for (let i = MAX_ATTEMPTS; i > 0; i--) {
        process.stdout.write('.');
        const result = await openai.beta.threads.runs.retrieve(threadId, runId);
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
    messagesCreate,
    messagesFetch,
    messagesReady,
    queryAssistant

};
