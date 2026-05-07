require('dotenv').config();
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const config = await prisma.rallyConfig.findFirst();
    const baseUrl = config.instanceUrl.replace(/\/$/, '');
    const headers = { 'zsessionid': config.apiKey, 'Accept': 'application/json' };
    
    // 1. Find the project first
    const projectUrl = `${baseUrl}/slm/webservice/v2.0/project?query=(Name = "QA Enterprise Billing Center")&fetch=ObjectID`;
    const projectRes = await axios.get(projectUrl, { headers });
    const project = projectRes.data?.QueryResult?.Results?.[0];
    
    if (project) {
      console.log('Project found:', project._refObjectName, project.ObjectID);
      // 2. Search for the folder in that project
      const folderUrl = `${baseUrl}/slm/webservice/v2.0/testfolder?query=(FormattedID = "TF5375")&project=${project._ref}&projectScopeUp=false&projectScopeDown=true&fetch=Name,FormattedID`;
      const folderRes = await axios.get(folderUrl, { headers });
      console.log('Folder results in project:', folderRes.data.QueryResult.Results.map(r => ({ name: r.Name, id: r.FormattedID })));
    } else {
      console.log('Project "QA Enterprise Billing Center" not found!');
      
      // Try global search again with a different workspace parameter if needed
      const globalUrl = `${baseUrl}/slm/webservice/v2.0/testfolder?query=(FormattedID = "TF5375")&workspace=https://rally1.rallydev.com/slm/webservice/v2.0/workspace/15956831576&fetch=Name,FormattedID`;
      const globalRes = await axios.get(globalUrl, { headers });
      console.log('Global results (scoped to workspace):', globalRes.data.QueryResult.Results.map(r => ({ name: r.Name, id: r.FormattedID })));
    }
  } catch (e) { console.error(e.response ? e.response.data : e); } finally { await prisma.$disconnect(); }
}
check();
