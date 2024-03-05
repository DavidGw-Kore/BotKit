var botId = "st-6684eeda-2a24-5df3-a658-e3316167cbad";
var botName = "Allegion Product Knowledge";
var sdk = require("./lib/sdk");

/*
 * This is the most basic example of BotKit.
 *
 * It showcases how the BotKit can intercept the message being sent to the bot or the user.
 *
 * We can either update the message, or chose to call one of 'sendBotMessage' or 'sendUserMessage'
 */
module.exports = {
    botId   : botId,
    botName : botName,

    on_user_message : function(requestId, data, callback) {
        if (data.message === "Hi") {
            data.message = "Hello";
            //Sends back 'Hello' to user.
            return sdk.sendUserMessage(data, callback);
        } else if(!data.agent_transfer){
            //Forward the message to bot
            return sdk.sendBotMessage(data, callback);
        } else {
            data.message = "Agent Message";
            return sdk.sendUserMessage(data, callback);
        }
    },
    on_bot_message  : function(requestId, data, callback) {
        if (data.message === 'hello') {
            data.message = 'The Bot says hello!';
        }
        //Sends back the message to user
        
        return sdk.sendUserMessage(data, callback);
    },
    on_agent_transfer : function(requestId, data, callback){
        return callback(null, data);
    },
    on_event : function (requestId, data, callback) {
        console.log("on_event -->  Event : ", data.event);
        return callback(null, data);
    },
    on_alert : function (requestId, data, callback) {
        console.log("on_alert -->  : ", data, data.message);
        return sdk.sendAlertMessage(data, callback);
    },
    on_webhook      : function(requestId, data, componentName, callback) {
        const context = data.context;
            
        if (componentName === 'QueryAssistant') {
            context.message = "Hello World!";
        } 
	switch (componentName) {
            case 'CreateAssistant':
		console.log(`Creating Open AI Assistant`);
                break;
            case 'QueryAssistant':
		console.log(`Querying assistant with utterance: ${context.query}`);
                context.message = "Hello World!";
                break;
           default:
               console.error(`Webhook handler not found for ${componentName}`);
        }
        callback(null, data);
    }


};


