require('dotenv').config();
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const config = await prisma.rallyConfig.findFirst();
    const baseUrl = config.instanceUrl.replace(/\/$/, '');
    const headers = { 'zsessionid': config.apiKey, 'Accept': 'application/json' };
    
    // Search for artifact by FormattedID with global scope
    const folderUrl = `${baseUrl}/slm/webservice/v2.0/artifact?query=(FormattedID = "TF5375")&fetch=Name,FormattedID,_type&project=null&projectScopeUp=true&projectScopeDown=true`;
    console.log("Fetching:", folderUrl);
    const res = await axios.get(folderUrl, { headers });
    
    console.log('Results:', res.data.QueryResult.Results.map(r => ({ name: r.Name, ref: r._ref, type: r._type })));
  } catch (e) { console.error(e.response ? e.response.data : e); } finally { await prisma.$disconnect(); }
}
check();
