//import "dotenv/config";
let fub_key = btoa(process.env.FUB_KEY);
async function getAgents(next, arr) {
  const response = await fetch(
    "https://api.followupboss.com/v1/users?" +
      new URLSearchParams({
        limit: 100,
        next: next,
      }),
      
    {
      headers: {
        Authorization: `Basic ${fub_key}`,
      },
    
    }
  );
  let agent = await response.json();
  if (agent._metadata.next) {
    arr = arr.concat(agent.users);
    return getAgents(agent._metadata.next, arr);
  } else {
    arr = arr.concat(agent.users);
    return arr;
  }
}

async function getLeads(agentId,next,arr) {
  const response = await fetch(
    "https://api.followupboss.com/v1/people?" +
      new URLSearchParams({
        assignedUserId: agentId,
        tags: "z_Print Denver Newsletter",
        next: next,
        fields: 'id,name,addresses',
        limit:100
      }),
    {
      headers: {
        Authorization: `Basic ${fub_key}`,
      },
    }
  );
    let people = await response.json();
    if (people._metadata.next) {
      arr = arr.concat(people.people);
      return getLeads(agentId,people._metadata.next, arr);
    } else {
      arr = arr.concat(people.people);
      return arr;
    }
}

module.exports = { 'getAgents':getAgents, 'getLeads':getLeads};
