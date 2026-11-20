export class IntegrationError extends Error{constructor(message,status=503){super(message);this.status=status;}}
export async function vendorJson(name,url,options={},fetchImpl=fetch){
 let response;try{response=await fetchImpl(url,{...options,redirect:'error',signal:AbortSignal.timeout(options.timeoutMs||18000)});}catch{throw new IntegrationError(`${name} could not be reached. Check the connection and try again.`);}
 if(!response.ok)throw new IntegrationError(response.status===401||response.status===403?`${name} rejected the credentials. Check its server configuration.`:response.status===429?`${name} is busy or has reached its usage limit. Please try again.`:`${name} returned ${response.status}. Please try again.`,502);
 try{return await response.json();}catch{throw new IntegrationError(`${name} returned an unreadable response.`,502);}
}
export function serverBase(value,name){if(!value)throw new IntegrationError(`Configure ${name} in Vercel first.`);const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash)throw new IntegrationError(`${name} must be an HTTPS service URL.`);return value.replace(/\/$/,'');}
