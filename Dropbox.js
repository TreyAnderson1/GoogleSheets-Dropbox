let code = process.env.CODE
let secret= process.env.SECRET
let token = ''
let refresh = process.env.REFRESH_TOKEN
let accountID = process.env.ACCOUNT_ID
const month = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const d = new Date();
let monthName = month[d.getMonth()];let year = new Date().getFullYear()
async function getAccess() {
  const response = await fetch(
   'https://api.dropboxapi.com/oauth2/token?'+ new URLSearchParams({client_id: process.env.CLIENT_ID,
   client_secret: secret,
   grant_type:'refresh_token',
   refresh_token:refresh}),
   {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    body:JSON.stringify({        
    client_id: process.env.CLIENT_ID,
    client_secret: secret,
    grant_type:'refresh_token',
    refresh_token:refresh})
   }
  );
  let res = await response.json()
  token = res.access_token //gets the access token
  const folder = await fetch(
    'https://api.dropboxapi.com/2/files/create_folder_v2',
    {
     method: 'POST',
     headers: {
       "Content-Type": "application/json",
       "Authorization": 'Bearer '+token
       // 'Content-Type': 'application/x-www-form-urlencoded',
     },
     body:JSON.stringify({        
      autorename: false,
      path: '/Print Newsletter/'+monthName+' '+year})
    }
   ); //create main folder in dropbox
  return res
}

async function createFolderAndCSV(csv,agentName) {
  for(let x = 0; x < csv.length;x++){
    csv[x][2] = csv[x][2].replaceAll(',','')
    if(x != 0){
    csv[x][0] = '\n'+csv[x][0]
    }
  }
  const folder = await fetch(
    'https://api.dropboxapi.com/2/files/create_folder_v2',
    {
     method: 'POST',
     headers: {
       "Content-Type": "application/json",
       "Authorization": 'Bearer '+token
       // 'Content-Type': 'application/x-www-form-urlencoded',
     },
     body:JSON.stringify({        
      autorename: false,
      path: '/Print Newsletter/'+monthName+' '+year+'/'+agentName})
    }
   ); //create agent folder in dropbox
    let folderPath = '/Print Newsletter/'+monthName + ' '+ year + '/'+agentName+'/ContactList.csv'
   const file = await fetch(
    'https://content.dropboxapi.com/2/files/upload',
    {
     method: 'POST',
     headers: {
       "Authorization": 'Bearer '+token,
       'Dropbox-API-Arg':`{ "autorename": false,"mode": "add","mute":true,"path":"${folderPath}", "strict_conflict": false}`,
       'Content-Type': 'application/octet-stream',
     },
     body:csv,
    }); //create csv in folder
}


module.exports={getAccess,createFolderAndCSV}