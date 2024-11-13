const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly','https://www.googleapis.com/auth/drive','https://www.googleapis.com/auth/drive.file','https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), process.env.GOOGLE_CLIENT_SECRET);
var folderID = ''
/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {OAuth2Client} authClient An authorized OAuth2 client.
 */
async function listFiles(authClient) {
  const drive = google.drive({version: 'v3', auth: authClient});
  const sheets = google.sheets({version:'v4',auth: authClient})
  const res = await drive.files.list({
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  });
  const files = res.data.files;
  if (files.length === 0) {
    console.log('No files found.');
    return;
  }

  console.log('Files:');
  files.map((file) => {
    console.log(`${file.name} (${file.id})`);
  });
}

/**
 * Search file in drive location
 * @return{obj} data file
 * */
async function searchFile(authClient) {
    const service = google.drive({version: 'v3', auth:authClient});
    try {
      const res = await service.files.list({
        q:'mimeType = \'application/vnd.google-apps.folder\'', //name needs to be agent name
        fields: 'nextPageToken, files(id, name)',
        spaces: 'drive',
      });
      Array.prototype.push.apply(files, res.files);
      res.data.files.forEach(function(file) {
        console.log('Found file:', file.name, file.id);
      });
      if(res.data.files.length > 0){ //there is a folder already

      }else{
      let folder =  await createFolder(authClient,'Test1')
      }//create a new folder for the agent
      return folder;
    } catch (err) {
      // TODO(developer) - Handle error
      throw err;
    }
  }


/**
 * Create a folder and prints the folder ID
 * @return{obj} folder Id
 * */
async function createFolder(authClient) {
    const service = google.drive({version: 'v3', auth:authClient});
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const d = new Date();
    let month = months[d.getMonth()];
    let year = new Date().getFullYear()

    const fileMetadata = {
      name: month.toString()+' '+year.toString(),
      mimeType: 'application/vnd.google-apps.folder',
      parents: [process.env.GOOGLE_FOLDER_PARENT]
    };
    try {
      const file = await service.files.create({
        resource: fileMetadata,
        fields: 'id',
      });
      console.log('Folder Id:', file.data.id);
      folderID = file.data.id
      return file.data.id;
    } catch (err) {
        await createFolder(authClient)
      throw err;
    }
  }
  async function createSpreadSheet(authClient,title) {
    const service = google.sheets({version: 'v4', auth:authClient});
    const resource = {
      properties: {
        title,
      },
    };
    try {
      const spreadsheet = await service.spreadsheets.create({
        resource,
        fields: 'spreadsheetId',
      });
      const drive = google.drive({version: 'v3', auth:authClient});
      const driveMoveOption = {
        fileId: spreadsheet.data.spreadsheetId, //You will insert this later
        addParents: [folderID],
        removeParents: "root" //To remove it from the "MyDrive" section
      }
      drive.files.update(driveMoveOption, function (err, response) {
        if (err) {
          console.error(err);
          return;
        }else{
          console.log(response)
        }
        });      console.log(`Spreadsheet ID: ${spreadsheet.data.spreadsheetId}`);
      return spreadsheet.data.spreadsheetId;
    } catch (err) {
      // TODO (developer) - Handle exception
      throw err;
    }
  }

  async function updateSpreadsheet(authClient,values,spreadsheetId){
    const service = google.sheets({version: 'v4', auth:authClient});

    const resource = {
      values,
    };


    try {
      const result = await service.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: 'Sheet1!A:E',
        valueInputOption: 'USER_ENTERED',
        resource: resource
      });
      console.log('%d cells updated.', result.data.updates.updatedCells);
      return result;
    } catch (err) {
      // TODO (Developer) - Handle exception
      throw err;
    }
  }


module.exports ={authorize,createFolder,createSpreadSheet,updateSpreadsheet}
//authorize().then(createFolder).catch(console.error);