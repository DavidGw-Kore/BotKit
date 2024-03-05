#!/usr/bin/env node
const OpenAI = require('openai');
const openai = new OpenAI();

const QUERY_DELAY_TIME = 1000;
const DELAY_TIME = 5000;
const MAX_ATTEMPTS = 25;

const sleep = async (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
};

async function createThread(context) {
    const thread = await openai.beta.threads.create();
    context.session.BotUserSession.threadId = thread.id;
    console.log(`context.session.BotUserSession.threadId: ${context.session.BotUserSession.threadId}`);
}

async function questionAnswer(assistantId, query, context) {
    const threadId = context.session.BotUserSession.threadId; 
    const message = await openai.beta.threads.messages.create(
        threadId,
        {
            role: "user",
            content: query
        }
    );
    const run = await openai.beta.threads.runs.create(
        threadId,
        {
            assistant_id: assistantId
        }
    );
    await retrieveMessages(threadId, run.id);
    const messages = await openai.beta.threads.messages.list(threadId);
    const assistantResponse = outputMessages(messages.data);
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
   context.session.BotUserSession.status = result.status;
}

/**
 *
 */
async function messagesFetch(context) {
    const threadId = context.session.BotUserSession.threadId;
    console.log(`threadId: ${threadId}`);
   
    const messages = await openai.beta.threads.messages.list(threadId);
    context.assistantResponse = outputMessages(messages.data);
}


async function retrieveMessages(threadId, runId) {
    for (let i = MAX_ATTEMPTS; i > 0; i--) {
        process.stdout.write('.');
        const result = await openai.beta.threads.runs.retrieve(threadId, runId);
        if (result.status === 'completed') {
            break;
        }
        await sleep(QUERY_DELAY_TIME);
    }
    console.log();
}

function outputMessages(data) {
    const answer = []
    for (const d of data) {
        if (d.role === 'user') {
            continue;
        }
	answer.push(d.content[0].text.value);
    }
    return answer.join(' ');
}

async function queryAssistant(context) {
    console.log(`QUERY: ${context.query}`);
    const assistantId = context.session.BotUserSession.assistantId;
    console.log(`assistantId: ${assistantId}`);
    const assistant = await openai.beta.assistants.retrieve(assistantId);
    await questionAnswer(assistant.id, context.query, context);
    console.log(`ANSWER:\n${context.assistantResponse}`);
}

module.exports = {
    createThread,
    messagesCreate,
    messagesFetch,
    messagesReady,
    queryAssistant

};
