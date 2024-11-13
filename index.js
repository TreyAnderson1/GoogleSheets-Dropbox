const FUB = require("./FUBAutomations.js");
const google = require("./Google.js");
const dropBox = require("./Dropbox.js")
const cron = require("node-cron");
const axios = require("axios");
const express = require("express");
app = express();
app.use(express.urlencoded({ extended: true }));
let url = process.env.HEROKU_URL
async function main() {
  let agents;
  console.log('started cron job')
  cron.schedule("0 15 * * * *", () => {
    axios.get(url);
    console.log("pinged");
  });
  cron.schedule("1 6 10 * *", async function () { //changed cron job to be the first second of the 10th of every month at 6:01
  await FUB.getAgents("", []).then((value) => {
    agents = value;
  }); //gets the agents
  let agentLeads = {}
  let access = await google.authorize(); //gets google access
  let folderID = await google.createFolder(access) //creates the google folder
  await dropBox.getAccess(); //gets the dropbox access and create main folder

   let values = []
  let spreadsheetId = ''
  for (agent of agents){
    await FUB.getLeads(agent.id, '', []).then((value)=>{
      agentLeads[agent.name] = value
    })
    if(agentLeads[agent.name].length > 0){ //if agent has any leads run
    spreadsheetId = await google.createSpreadSheet(access,agent.name) //create CSV for the agents
    if(agentLeads[agent.name][0].addresses.length > 0){
      agentLeads[agent.name][0].street = agentLeads[agent.name][0].addresses[0].street
      agentLeads[agent.name][0].city = agentLeads[agent.name][0].addresses[0].city
      agentLeads[agent.name][0].state = agentLeads[agent.name][0].addresses[0].state
      agentLeads[agent.name][0].code = agentLeads[agent.name][0].addresses[0].code
      delete agentLeads[agent.name][0].addresses
    }else{
      agentLeads[agent.name][0].street = ''
      agentLeads[agent.name][0].city = ''
      agentLeads[agent.name][0].state = ''
      agentLeads[agent.name][0].code = ''
      delete agentLeads[agent.name][0].addresses
    }
    values.push(Object.keys(agentLeads[agent.name][0])) //gets the headers
    for(x of agentLeads[agent.name]){
      if(x.addresses && x.addresses.length > 0){
        x.street = x.addresses[0].street
        x.city = x.addresses[0].city
        x.state = x.addresses[0].state
        x.code = x.addresses[0].code
        delete x.addresses
      }else if(x.addresses){
        x.street = ''
        x.city = ''
        x.state = ''
        x.code = ''
        delete x.addresses
      }
      values.push(Object.values(x))
    } //loops through creating arrays for each value
    await google.updateSpreadsheet(access,values,spreadsheetId) //updates the google sheet
    await dropBox.createFolderAndCSV(values,agent.name) //create and upload csv with values

    values = []
  } //gets the leads for each agent

  } // get FUB Items and create folder and each spreadsheet

  const response = await fetch(process.env.ZAPIER_HOOK, {
    method: "POST", // *GET, POST, PUT, DELETE, etc.
    mode: "cors", // no-cors, *cors, same-origin
    cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    credentials: "same-origin", // include, *same-origin, omit
    headers: {
      "Content-Type": "application/json",
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: "follow", // manual, *follow, error
    referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify({folderId: folderID}), // body data type must match "Content-Type" header
  });
  console.log("running a task every 10th of every month");
 });
}
app.get("/", function (req, res) {
  res.send("Hello");
});
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}..`));

main();

