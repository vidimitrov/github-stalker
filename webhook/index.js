'use strict';

const https = require('https');
const url = require('url');
const API_URL = url.parse('https://api.github.com');
const HOST = API_URL.hostname;
const TOKEN = '<YOUR_GITHUB_TOKEN>';

exports.stalkerBot = (request, response) => {
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
  if (request.body.result) {
    processRequest(request, response);
  } else {
    console.log('Invalid Request');
    return response.status(400).end('Invalid Webhook Request (expecting v1 or v2 webhook request)');
  }
};

function processRequest(request, response) {
  let action = request.body.result.action; // https://dialogflow.com/docs/actions-and-parameters
  let parameters = request.body.result.parameters; // https://dialogflow.com/docs/actions-and-parameters
  let inputContexts = request.body.result.contexts; // https://dialogflow.com/docs/contexts
  let requestSource = (request.body.originalRequest) ? request.body.originalRequest.source : undefined;

  // Create handlers for Dialogflow actions as well as a 'default' handler
  const actionHandlers = {
    'user': () => {
      let user = parameters.user;
      callGithubApi(user).then((output) => {
        sendResponse({
          speech: output,
          text: output
        });
      }).catch((error) => {
        // If there is an error let the user know
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ 'speech': error, 'displayText': error }));
      });
    },
    'user.followers': () => {
      let user = parameters.user;
      callGithubApi(user, 'followers').then((output) => {
        sendResponse({
          speech: output,
          text: output
        });
      }).catch((error) => {
        // If there is an error let the user know
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ 'speech': error, 'displayText': error }));
      });
    },
    'user.following': () => {
      let user = parameters.user;
      callGithubApi(user, 'following').then((output) => {
        sendResponse({
          speech: output,
          text: output
        });
      }).catch((error) => {
        // If there is an error let the user know
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ 'speech': error, 'displayText': error }));
      });
    },
    'user.repos': () => {
      let user = parameters.user;
      callGithubApi(user, 'repos').then((output) => {
        sendResponse({
          speech: output,
          text: output
        });
      }).catch((error) => {
        // If there is an error let the user know
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ 'speech': error, 'displayText': error }));
      });
    },
    'user.starred': () => {
      let user = parameters.user;
      callGithubApi(user, 'starred').then((output) => {
        sendResponse({
          speech: output,
          text: output
        });
      }).catch((error) => {
        // If there is an error let the user know
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ 'speech': error, 'displayText': error }));
      });
    },
    // Default handler for unknown or undefined actions
    'default': () => {
      let responseToUser = {
        //data: richResponsesV1, // Optional, uncomment to enable
        //outputContexts: [{'name': 'weather', 'lifespan': 2, 'parameters': {'city': 'Rome'}}], // Optional, uncomment to enable
        speech: 'This message is a default one!', // spoken response
        text: 'This message is a default one!' // displayed response
      };
      sendResponse(responseToUser);
    }
  };
  // If undefined or unknown action use the default handler
  if (!actionHandlers[action]) {
    action = 'default';
  }
  // Run the proper handler function to handle the request from Dialogflow
  actionHandlers[action]();

  // Function to send correctly formatted responses to Dialogflow which are then sent to the user
  function sendResponse(responseToUser) {
    // if the response is a string send it as a response to the user
    if (typeof responseToUser === 'string') {
      let responseJson = {};
      responseJson.speech = responseToUser; // spoken response
      responseJson.displayText = responseToUser; // displayed response
      response.json(responseJson); // Send response to Dialogflow
    } else {
      // If the response to the user includes rich responses or contexts send them to Dialogflow
      let responseJson = {};
      // If speech or displayText is defined, use it to respond (if one isn't defined use the other's value)
      responseJson.speech = responseToUser.speech || responseToUser.displayText;
      responseJson.displayText = responseToUser.displayText || responseToUser.speech;
      // Optional: add rich messages for integrations (https://dialogflow.com/docs/rich-messages)
      responseJson.data = responseToUser.data;
      // Optional: add contexts (https://dialogflow.com/docs/contexts)
      responseJson.contextOut = responseToUser.outputContexts;
      console.log('Response to Dialogflow: ' + JSON.stringify(responseJson));
      response.json(responseJson); // Send response to Dialogflow
    }
  }
}

function callGithubApi(username, resource) {
  return new Promise((resolve, reject) => {
    // Create the path for the HTTP request to get the weather
    let path = '/users/' + username;

    if (resource) {
      switch (resource) {
        case 'following':
          path += '/following';
          break;
        case 'followers':
          path += '/followers';
          break;
        case 'repos':
          path += '/repos';
          break;
        case 'starred':
          path += '/starred';
          break;
      }
    }

    path += '?access_token=' + TOKEN;
    console.log('API Request: ' + HOST + path);
    // Make the HTTP request to get the github data
    https.get({
      host: HOST,
      path,
      headers: {
        'User-Agent': 'Stalker'
      }
    }, (res) => {
      // console.log(res);
      const { statusCode } = res;
      console.log('Status code: ', statusCode);
      res.setEncoding('utf8');
      let body = ''; // var to store the response chunks
      res.on('data', (chunk) => { body += chunk; }); // store each response chunk
      res.on('end', () => {
        // After all the data has been received parse the JSON for desired data

        let data = JSON.parse(body);

        if (resource) {
          switch (resource) {
            case 'following': {
              let following = data.map((f) => f.login);
              let output = `He is following ${following.length} users. Here are they: ${following.join(', ')}`;
              console.log(output);
              resolve(output);
              break;
            }
            case 'followers': {
              let followers = data.map((follower) => follower.login);
              let output = `The guy has ${followers.length} followers. Here are they: ${followers.join(', ')}`;
              console.log(output);
              resolve(output);
              break;
            }
            case 'repos': {
              let repos = data.map((repo) => repo.name);
              let output = `He has ${repos.length} repositories. Here are their names: ${repos.join(', ')}`;
              console.log(output);
              resolve(output);
              break;
            }
            case 'starred': {
              let starredRepos = data.map((repo) => repo.name);
              let output = `He starred ${starredRepos.length} repositories. Here are some of them: ${starredRepos.join(', ')}`;
              console.log(output);
              resolve(output);
              break;
            }
          }
        } else {
          let output = `The name of this user is ${data.name}. Registered since ${new Date(data.created_at).toLocaleString()}, he has ${data.public_repos} public repositories. He is a ${data.bio && data.bio.toLowerCase()}`;
          console.log(output);
          resolve(output);
        }

      });
      res.on('error', (error) => {
        reject(error);
      });
    });
  });
}

// For testing purposes

// callGithubApi('vidimitrov');
// callGithubApi('vidimitrov', 'repos');
// callGithubApi('vidimitrov', 'followers');
// callGithubApi('vidimitrov', 'following');
// callGithubApi('vidimitrov', 'starred');
