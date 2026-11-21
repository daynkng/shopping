import {inputJson,send,fail} from '../src/http-api.js';
import {testConnection} from '../src/integrations.js';
import {credentialEnv,sessionEnv,writeConnection,connectionMetadata,integrationIds,cookieValue,unseal} from '../src/session-connections.js';
export default async function handler(req,res){try{
 if(req.method==='GET')return send(res,200,{connections:connectionMetadata(req)});
 const b=await inputJson(req),id=b.integration;if(!integrationIds.includes(id))throw new Error('Unknown integration.');
 if(b.action==='context'){const token=cookieValue(req,id);if(id!=='cognee'||!token)throw new Error('Connect Cognee first.');const value=unseal(id,token);if(value.state!=='connected')throw new Error('Connect Cognee first.');writeConnection(res,id,{...value,useContext:b.enabled===true});return send(res,200,{contextSource:b.enabled?'cognee':'sample'});}
 if(b.action==='disconnect'){writeConnection(res,id,{state:'disconnected'});return send(res,200,{integration:id,connected:false});}
 const credentials=b.action==='managed'?null:credentialEnv(id,b);const env=b.action==='managed'?process.env:{...sessionEnv(req),...credentials};
 const result=await testConnection(id,b.owner==='jordan'?'jordan':'maya',{env});if(id==='cognee')await testConnection(id,'jordan',{env});
 writeConnection(res,id,{state:'connected',credentials,managed:b.action==='managed',useContext:id==='cognee'?false:undefined,verifiedAt:result.checkedAt});send(res,200,{integration:id,connected:true,verifiedAt:result.checkedAt});
 }catch(e){fail(res,e);}}
