import{r as e,j as t,A as n,m as s,e as o,z as a,g as i,U as r,H as l,a as c}from"./index-vd7Ycuse.js";import{U as d}from"./aws-OCO_JW2t.js";var u,h,m,g,f,p;(h=u||(u={})).STRING="string",h.NUMBER="number",h.INTEGER="integer",h.BOOLEAN="boolean",h.ARRAY="array",h.OBJECT="object",(g=m||(m={})).LANGUAGE_UNSPECIFIED="language_unspecified",g.PYTHON="python",(p=f||(f={})).OUTCOME_UNSPECIFIED="outcome_unspecified",p.OUTCOME_OK="outcome_ok",p.OUTCOME_FAILED="outcome_failed",p.OUTCOME_DEADLINE_EXCEEDED="outcome_deadline_exceeded";
/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const y=["user","model","function","system"];var x,C,b,E,v,N,O,_,I,w,T,j,A,S,R,k;(C=x||(x={})).HARM_CATEGORY_UNSPECIFIED="HARM_CATEGORY_UNSPECIFIED",C.HARM_CATEGORY_HATE_SPEECH="HARM_CATEGORY_HATE_SPEECH",C.HARM_CATEGORY_SEXUALLY_EXPLICIT="HARM_CATEGORY_SEXUALLY_EXPLICIT",C.HARM_CATEGORY_HARASSMENT="HARM_CATEGORY_HARASSMENT",C.HARM_CATEGORY_DANGEROUS_CONTENT="HARM_CATEGORY_DANGEROUS_CONTENT",C.HARM_CATEGORY_CIVIC_INTEGRITY="HARM_CATEGORY_CIVIC_INTEGRITY",(E=b||(b={})).HARM_BLOCK_THRESHOLD_UNSPECIFIED="HARM_BLOCK_THRESHOLD_UNSPECIFIED",E.BLOCK_LOW_AND_ABOVE="BLOCK_LOW_AND_ABOVE",E.BLOCK_MEDIUM_AND_ABOVE="BLOCK_MEDIUM_AND_ABOVE",E.BLOCK_ONLY_HIGH="BLOCK_ONLY_HIGH",E.BLOCK_NONE="BLOCK_NONE",(N=v||(v={})).HARM_PROBABILITY_UNSPECIFIED="HARM_PROBABILITY_UNSPECIFIED",N.NEGLIGIBLE="NEGLIGIBLE",N.LOW="LOW",N.MEDIUM="MEDIUM",N.HIGH="HIGH",(_=O||(O={})).BLOCKED_REASON_UNSPECIFIED="BLOCKED_REASON_UNSPECIFIED",_.SAFETY="SAFETY",_.OTHER="OTHER",(w=I||(I={})).FINISH_REASON_UNSPECIFIED="FINISH_REASON_UNSPECIFIED",w.STOP="STOP",w.MAX_TOKENS="MAX_TOKENS",w.SAFETY="SAFETY",w.RECITATION="RECITATION",w.LANGUAGE="LANGUAGE",w.BLOCKLIST="BLOCKLIST",w.PROHIBITED_CONTENT="PROHIBITED_CONTENT",w.SPII="SPII",w.MALFORMED_FUNCTION_CALL="MALFORMED_FUNCTION_CALL",w.OTHER="OTHER",(j=T||(T={})).TASK_TYPE_UNSPECIFIED="TASK_TYPE_UNSPECIFIED",j.RETRIEVAL_QUERY="RETRIEVAL_QUERY",j.RETRIEVAL_DOCUMENT="RETRIEVAL_DOCUMENT",j.SEMANTIC_SIMILARITY="SEMANTIC_SIMILARITY",j.CLASSIFICATION="CLASSIFICATION",j.CLUSTERING="CLUSTERING",(S=A||(A={})).MODE_UNSPECIFIED="MODE_UNSPECIFIED",S.AUTO="AUTO",S.ANY="ANY",S.NONE="NONE",(k=R||(R={})).MODE_UNSPECIFIED="MODE_UNSPECIFIED",k.MODE_DYNAMIC="MODE_DYNAMIC";
/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class M extends Error{constructor(e){super(`[GoogleGenerativeAI Error]: ${e}`)}}class P extends M{constructor(e,t){super(e),this.response=t}}class D extends M{constructor(e,t,n,s){super(e),this.status=t,this.statusText=n,this.errorDetails=s}}class L extends M{}class F extends M{}
/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var G,H;(H=G||(G={})).GENERATE_CONTENT="generateContent",H.STREAM_GENERATE_CONTENT="streamGenerateContent",H.COUNT_TOKENS="countTokens",H.EMBED_CONTENT="embedContent",H.BATCH_EMBED_CONTENTS="batchEmbedContents";class U{constructor(e,t,n,s,o){this.model=e,this.task=t,this.apiKey=n,this.stream=s,this.requestOptions=o}toString(){var e,t;const n=(null===(e=this.requestOptions)||void 0===e?void 0:e.apiVersion)||"v1beta";let s=`${(null===(t=this.requestOptions)||void 0===t?void 0:t.baseUrl)||"https://generativelanguage.googleapis.com"}/${n}/${this.model}:${this.task}`;return this.stream&&(s+="?alt=sse"),s}}async function $(e){var t;const n=new Headers;n.append("Content-Type","application/json"),n.append("x-goog-api-client",function(e){const t=[];return(null==e?void 0:e.apiClient)&&t.push(e.apiClient),t.push("genai-js/0.24.1"),t.join(" ")}(e.requestOptions)),n.append("x-goog-api-key",e.apiKey);let s=null===(t=e.requestOptions)||void 0===t?void 0:t.customHeaders;if(s){if(!(s instanceof Headers))try{s=new Headers(s)}catch(o){throw new L(`unable to convert customHeaders value ${JSON.stringify(s)} to Headers: ${o.message}`)}for(const[e,t]of s.entries()){if("x-goog-api-key"===e)throw new L(`Cannot set reserved header name ${e}`);if("x-goog-api-client"===e)throw new L(`Header name ${e} can only be set using the apiClient field`);n.append(e,t)}}return n}async function Y(e,t,n,s,o,a={},i=fetch){const{url:r,fetchOptions:l}=await async function(e,t,n,s,o,a){const i=new U(e,t,n,s,a);return{url:i.toString(),fetchOptions:Object.assign(Object.assign({},K(a)),{method:"POST",headers:await $(i),body:o})}}(e,t,n,s,o,a);return async function(e,t,n=fetch){let s;try{s=await n(e,t)}catch(o){!function(e,t){let n=e;"AbortError"===n.name?(n=new F(`Request aborted when fetching ${t.toString()}: ${e.message}`),n.stack=e.stack):e instanceof D||e instanceof L||(n=new M(`Error fetching from ${t.toString()}: ${e.message}`),n.stack=e.stack);throw n}(o,e)}s.ok||await async function(e,t){let n,s="";try{const t=await e.json();s=t.error.message,t.error.details&&(s+=` ${JSON.stringify(t.error.details)}`,n=t.error.details)}catch(o){}throw new D(`Error fetching from ${t.toString()}: [${e.status} ${e.statusText}] ${s}`,e.status,e.statusText,n)}(s,e);return s}(r,l,i)}function K(e){const t={};if(void 0!==(null==e?void 0:e.signal)||(null==e?void 0:e.timeout)>=0){const n=new AbortController;(null==e?void 0:e.timeout)>=0&&setTimeout(()=>n.abort(),e.timeout),(null==e?void 0:e.signal)&&e.signal.addEventListener("abort",()=>{n.abort()}),t.signal=n.signal}return t}
/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function B(e){return e.text=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length,V(e.candidates[0]))throw new P(`${W(e)}`,e);return function(e){var t,n,s,o;const a=[];if(null===(n=null===(t=e.candidates)||void 0===t?void 0:t[0].content)||void 0===n?void 0:n.parts)for(const i of null===(o=null===(s=e.candidates)||void 0===s?void 0:s[0].content)||void 0===o?void 0:o.parts)i.text&&a.push(i.text),i.executableCode&&a.push("\n```"+i.executableCode.language+"\n"+i.executableCode.code+"\n```\n"),i.codeExecutionResult&&a.push("\n```\n"+i.codeExecutionResult.output+"\n```\n");return a.length>0?a.join(""):""}(e)}if(e.promptFeedback)throw new P(`Text not available. ${W(e)}`,e);return""},e.functionCall=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length,V(e.candidates[0]))throw new P(`${W(e)}`,e);return q(e)[0]}if(e.promptFeedback)throw new P(`Function call not available. ${W(e)}`,e)},e.functionCalls=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length,V(e.candidates[0]))throw new P(`${W(e)}`,e);return q(e)}if(e.promptFeedback)throw new P(`Function call not available. ${W(e)}`,e)},e}function q(e){var t,n,s,o;const a=[];if(null===(n=null===(t=e.candidates)||void 0===t?void 0:t[0].content)||void 0===n?void 0:n.parts)for(const i of null===(o=null===(s=e.candidates)||void 0===s?void 0:s[0].content)||void 0===o?void 0:o.parts)i.functionCall&&a.push(i.functionCall);return a.length>0?a:void 0}const J=[I.RECITATION,I.SAFETY,I.LANGUAGE];function V(e){return!!e.finishReason&&J.includes(e.finishReason)}function W(e){var t,n,s;let o="";if(e.candidates&&0!==e.candidates.length||!e.promptFeedback){if(null===(s=e.candidates)||void 0===s?void 0:s[0]){const t=e.candidates[0];V(t)&&(o+=`Candidate was blocked due to ${t.finishReason}`,t.finishMessage&&(o+=`: ${t.finishMessage}`))}}else o+="Response was blocked",(null===(t=e.promptFeedback)||void 0===t?void 0:t.blockReason)&&(o+=` due to ${e.promptFeedback.blockReason}`),(null===(n=e.promptFeedback)||void 0===n?void 0:n.blockReasonMessage)&&(o+=`: ${e.promptFeedback.blockReasonMessage}`);return o}function z(e){return this instanceof z?(this.v=e,this):new z(e)}function X(e,t,n){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var s,o=n.apply(e,t||[]),a=[];return s={},i("next"),i("throw"),i("return"),s[Symbol.asyncIterator]=function(){return this},s;function i(e){o[e]&&(s[e]=function(t){return new Promise(function(n,s){a.push([e,t,n,s])>1||r(e,t)})})}function r(e,t){try{(n=o[e](t)).value instanceof z?Promise.resolve(n.value.v).then(l,c):d(a[0][2],n)}catch(s){d(a[0][3],s)}var n}function l(e){r("next",e)}function c(e){r("throw",e)}function d(e,t){e(t),a.shift(),a.length&&r(a[0][0],a[0][1])}}"function"==typeof SuppressedError&&SuppressedError;
/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const Q=/^data\: (.*)(?:\n\n|\r\r|\r\n\r\n)/;function Z(e){const t=function(e){const t=e.getReader();return new ReadableStream({start(e){let n="";return s();function s(){return t.read().then(({value:t,done:o})=>{if(o)return n.trim()?void e.error(new M("Failed to parse stream")):void e.close();n+=t;let a,i=n.match(Q);for(;i;){try{a=JSON.parse(i[1])}catch(r){return void e.error(new M(`Error parsing JSON response: "${i[1]}"`))}e.enqueue(a),n=n.substring(i[0].length),i=n.match(Q)}return s()}).catch(e=>{let t=e;throw t.stack=e.stack,t="AbortError"===t.name?new F("Request aborted when reading from the stream"):new M("Error reading from the stream"),t})}}})}(e.body.pipeThrough(new TextDecoderStream("utf8",{fatal:!0}))),[n,s]=t.tee();return{stream:te(n),response:ee(s)}}async function ee(e){const t=[],n=e.getReader();for(;;){const{done:e,value:s}=await n.read();if(e)return B(ne(t));t.push(s)}}function te(e){return X(this,arguments,function*(){const t=e.getReader();for(;;){const{value:e,done:n}=yield z(t.read());if(n)break;yield yield z(B(e))}})}function ne(e){const t=e[e.length-1],n={promptFeedback:null==t?void 0:t.promptFeedback};for(const s of e){if(s.candidates){let e=0;for(const t of s.candidates)if(n.candidates||(n.candidates=[]),n.candidates[e]||(n.candidates[e]={index:e}),n.candidates[e].citationMetadata=t.citationMetadata,n.candidates[e].groundingMetadata=t.groundingMetadata,n.candidates[e].finishReason=t.finishReason,n.candidates[e].finishMessage=t.finishMessage,n.candidates[e].safetyRatings=t.safetyRatings,t.content&&t.content.parts){n.candidates[e].content||(n.candidates[e].content={role:t.content.role||"user",parts:[]});const s={};for(const o of t.content.parts)o.text&&(s.text=o.text),o.functionCall&&(s.functionCall=o.functionCall),o.executableCode&&(s.executableCode=o.executableCode),o.codeExecutionResult&&(s.codeExecutionResult=o.codeExecutionResult),0===Object.keys(s).length&&(s.text=""),n.candidates[e].content.parts.push(s)}e++}s.usageMetadata&&(n.usageMetadata=s.usageMetadata)}return n}
/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function se(e,t,n,s){return Z(await Y(t,G.STREAM_GENERATE_CONTENT,e,!0,JSON.stringify(n),s))}async function oe(e,t,n,s){const o=await Y(t,G.GENERATE_CONTENT,e,!1,JSON.stringify(n),s);return{response:B(await o.json())}}
/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ae(e){if(null!=e)return"string"==typeof e?{role:"system",parts:[{text:e}]}:e.text?{role:"system",parts:[e]}:e.parts?e.role?e:{role:"system",parts:e.parts}:void 0}function ie(e){let t=[];if("string"==typeof e)t=[{text:e}];else for(const n of e)"string"==typeof n?t.push({text:n}):t.push(n);return function(e){const t={role:"user",parts:[]},n={role:"function",parts:[]};let s=!1,o=!1;for(const a of e)"functionResponse"in a?(n.parts.push(a),o=!0):(t.parts.push(a),s=!0);if(s&&o)throw new M("Within a single message, FunctionResponse cannot be mixed with other type of part in the request for sending chat message.");if(!s&&!o)throw new M("No content is provided for sending chat message.");if(s)return t;return n}(t)}function re(e){let t;if(e.contents)t=e;else{t={contents:[ie(e)]}}return e.systemInstruction&&(t.systemInstruction=ae(e.systemInstruction)),t}
/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const le=["text","inlineData","functionCall","functionResponse","executableCode","codeExecutionResult"],ce={user:["text","inlineData"],function:["functionResponse"],model:["text","functionCall","executableCode","codeExecutionResult"],system:["text"]};function de(e){var t;if(void 0===e.candidates||0===e.candidates.length)return!1;const n=null===(t=e.candidates[0])||void 0===t?void 0:t.content;if(void 0===n)return!1;if(void 0===n.parts||0===n.parts.length)return!1;for(const s of n.parts){if(void 0===s||0===Object.keys(s).length)return!1;if(void 0!==s.text&&""===s.text)return!1}return!0}
/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ue="SILENT_ERROR";class he{constructor(e,t,n,s={}){this.model=t,this.params=n,this._requestOptions=s,this._history=[],this._sendPromise=Promise.resolve(),this._apiKey=e,(null==n?void 0:n.history)&&(!function(e){let t=!1;for(const n of e){const{role:e,parts:s}=n;if(!t&&"user"!==e)throw new M(`First content should be with role 'user', got ${e}`);if(!y.includes(e))throw new M(`Each item should include role field. Got ${e} but valid roles are: ${JSON.stringify(y)}`);if(!Array.isArray(s))throw new M("Content should have 'parts' property with an array of Parts");if(0===s.length)throw new M("Each Content should have at least one part");const o={text:0,inlineData:0,functionCall:0,functionResponse:0,fileData:0,executableCode:0,codeExecutionResult:0};for(const t of s)for(const e of le)e in t&&(o[e]+=1);const a=ce[e];for(const t of le)if(!a.includes(t)&&o[t]>0)throw new M(`Content with role '${e}' can't contain '${t}' part`);t=!0}}(n.history),this._history=n.history)}async getHistory(){return await this._sendPromise,this._history}async sendMessage(e,t={}){var n,s,o,a,i,r;await this._sendPromise;const l=ie(e),c={safetySettings:null===(n=this.params)||void 0===n?void 0:n.safetySettings,generationConfig:null===(s=this.params)||void 0===s?void 0:s.generationConfig,tools:null===(o=this.params)||void 0===o?void 0:o.tools,toolConfig:null===(a=this.params)||void 0===a?void 0:a.toolConfig,systemInstruction:null===(i=this.params)||void 0===i?void 0:i.systemInstruction,cachedContent:null===(r=this.params)||void 0===r?void 0:r.cachedContent,contents:[...this._history,l]},d=Object.assign(Object.assign({},this._requestOptions),t);let u;return this._sendPromise=this._sendPromise.then(()=>oe(this._apiKey,this.model,c,d)).then(e=>{var t;if(de(e.response)){this._history.push(l);const n=Object.assign({parts:[],role:"model"},null===(t=e.response.candidates)||void 0===t?void 0:t[0].content);this._history.push(n)}else{W(e.response)}u=e}).catch(e=>{throw this._sendPromise=Promise.resolve(),e}),await this._sendPromise,u}async sendMessageStream(e,t={}){var n,s,o,a,i,r;await this._sendPromise;const l=ie(e),c={safetySettings:null===(n=this.params)||void 0===n?void 0:n.safetySettings,generationConfig:null===(s=this.params)||void 0===s?void 0:s.generationConfig,tools:null===(o=this.params)||void 0===o?void 0:o.tools,toolConfig:null===(a=this.params)||void 0===a?void 0:a.toolConfig,systemInstruction:null===(i=this.params)||void 0===i?void 0:i.systemInstruction,cachedContent:null===(r=this.params)||void 0===r?void 0:r.cachedContent,contents:[...this._history,l]},d=Object.assign(Object.assign({},this._requestOptions),t),u=se(this._apiKey,this.model,c,d);return this._sendPromise=this._sendPromise.then(()=>u).catch(e=>{throw new Error(ue)}).then(e=>e.response).then(e=>{if(de(e)){this._history.push(l);const t=Object.assign({},e.candidates[0].content);t.role||(t.role="model"),this._history.push(t)}else{W(e)}}).catch(e=>{e.message}),u}}
/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class me{constructor(e,t,n={}){this.apiKey=e,this._requestOptions=n,t.model.includes("/")?this.model=t.model:this.model=`models/${t.model}`,this.generationConfig=t.generationConfig||{},this.safetySettings=t.safetySettings||[],this.tools=t.tools,this.toolConfig=t.toolConfig,this.systemInstruction=ae(t.systemInstruction),this.cachedContent=t.cachedContent}async generateContent(e,t={}){var n;const s=re(e),o=Object.assign(Object.assign({},this._requestOptions),t);return oe(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:null===(n=this.cachedContent)||void 0===n?void 0:n.name},s),o)}async generateContentStream(e,t={}){var n;const s=re(e),o=Object.assign(Object.assign({},this._requestOptions),t);return se(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:null===(n=this.cachedContent)||void 0===n?void 0:n.name},s),o)}startChat(e){var t;return new he(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:null===(t=this.cachedContent)||void 0===t?void 0:t.name},e),this._requestOptions)}async countTokens(e,t={}){const n=function(e,t){var n;let s={model:null==t?void 0:t.model,generationConfig:null==t?void 0:t.generationConfig,safetySettings:null==t?void 0:t.safetySettings,tools:null==t?void 0:t.tools,toolConfig:null==t?void 0:t.toolConfig,systemInstruction:null==t?void 0:t.systemInstruction,cachedContent:null===(n=null==t?void 0:t.cachedContent)||void 0===n?void 0:n.name,contents:[]};const o=null!=e.generateContentRequest;if(e.contents){if(o)throw new L("CountTokensRequest must have one of contents or generateContentRequest, not both.");s.contents=e.contents}else if(o)s=Object.assign(Object.assign({},s),e.generateContentRequest);else{const t=ie(e);s.contents=[t]}return{generateContentRequest:s}}(e,{model:this.model,generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:this.cachedContent}),s=Object.assign(Object.assign({},this._requestOptions),t);return async function(e,t,n,s){return(await Y(t,G.COUNT_TOKENS,e,!1,JSON.stringify(n),s)).json()}
/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */(this.apiKey,this.model,n,s)}async embedContent(e,t={}){const n=function(e){if("string"==typeof e||Array.isArray(e))return{content:ie(e)};return e}(e),s=Object.assign(Object.assign({},this._requestOptions),t);return async function(e,t,n,s){return(await Y(t,G.EMBED_CONTENT,e,!1,JSON.stringify(n),s)).json()}(this.apiKey,this.model,n,s)}async batchEmbedContents(e,t={}){const n=Object.assign(Object.assign({},this._requestOptions),t);return async function(e,t,n,s){const o=n.requests.map(e=>Object.assign(Object.assign({},e),{model:t}));return(await Y(t,G.BATCH_EMBED_CONTENTS,e,!1,JSON.stringify({requests:o}),s)).json()}(this.apiKey,this.model,e,n)}}
/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ge{constructor(e){this.apiKey=e}getGenerativeModel(e,t){if(!e.model)throw new M("Must provide a model name. Example: genai.getGenerativeModel({ model: 'my-model-name' })");return new me(this.apiKey,e,t)}getGenerativeModelFromCachedContent(e,t,n){if(!e.name)throw new L("Cached content must contain a `name` field.");if(!e.model)throw new L("Cached content must contain a `model` field.");const s=["model","systemInstruction"];for(const a of s)if((null==t?void 0:t[a])&&e[a]&&(null==t?void 0:t[a])!==e[a]){if("model"===a){if((t.model.startsWith("models/")?t.model.replace("models/",""):t.model)===(e.model.startsWith("models/")?e.model.replace("models/",""):e.model))continue}throw new L(`Different value for "${a}" specified in modelParams (${t[a]}) and cachedContent (${e[a]})`)}const o=Object.assign(Object.assign({},t),{model:e.model,tools:e.tools,toolConfig:e.toolConfig,systemInstruction:e.systemInstruction,cachedContent:e});return new me(this.apiKey,o,n)}}const fe=({mode:i,postContext:r,onClose:l,onGenerate:c})=>{const[d,u]=e.useState(""),[h,m]=e.useState(!1),[g,f]=e.useState(""),p="post"===i?"AI Post Generator":"AI Comment Generator",y="post"===i?"Enter a topic for the post:":"AI will generate a reply to this post:",x="post"===i?"Generate Post":"Generate Comment";return t.jsx(n,{children:t.jsx(s.div,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},className:"fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4",onClick:l,role:"dialog","aria-modal":"true",children:t.jsxs(s.div,{initial:{scale:.9,y:20},animate:{scale:1,y:0},exit:{scale:.9,y:20},transition:{type:"spring",stiffness:300,damping:25},className:"bg-white dark:bg-dark-grey-2 rounded-lg shadow-xl w-full max-w-lg p-6 m-4",onClick:e=>e.stopPropagation(),children:[t.jsxs("div",{className:"flex justify-between items-center mb-4",children:[t.jsxs("h3",{className:"text-xl font-semibold text-dark-grey dark:text-white flex items-center",children:[t.jsx("i",{className:"fi fi-rr-sparkles text-blue-500 mr-2"}),p]}),t.jsx("button",{onClick:l,className:"p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-grey",children:t.jsx("i",{className:"fi fi-rr-cross text-sm"})})]}),g&&t.jsx("p",{className:"text-red-500 text-sm mb-3",children:g}),t.jsxs("form",{onSubmit:async e=>{if(e.preventDefault(),"post"!==i||d.trim()){m(!0),f("");try{const e="AIzaSyD28hePi_i0GNg-FxBSYjH7lKlDiN9rePY",n=new ge(e).getGenerativeModel({model:"gemini-2.0-flash"});let s="";s="post"===i?`You are a helpful assistant that creates engaging community posts. Create a post about: "${d}". \n                \nPlease respond with ONLY a valid JSON object in this exact format (no markdown, no code blocks):\n{"title": "catchy title here", "content": "detailed content here"}\n\nThe title should be catchy and under 200 characters. The content should be informative, engaging, and 2-3 paragraphs long.`:`You are a helpful assistant that creates thoughtful comments on posts. \n                \nPost Title: "${r.title}"\nPost Content: "${r.content||"No additional content"}"\n\nPlease write a thoughtful, relevant comment or reply to this post. Keep it conversational, friendly, and under 300 words. Respond with ONLY the comment text, no extra formatting.`;const o=await n.generateContent(s),u=(await o.response).text();if("post"===i)try{let e=u.trim();e.startsWith("```json")?e=e.replace(/```json\n?/g,"").replace(/```\n?$/g,""):e.startsWith("```")&&(e=e.replace(/```\n?/g,"").replace(/```\n?$/g,""));const t=JSON.parse(e);c(t.title,t.content),a.success("AI content generated!"),l()}catch(t){const e=u.match(/"title":\s*"([^"]+)"/),n=u.match(/"content":\s*"([^"]+)"/);if(!e||!n)throw new Error("Could not parse AI response. Please try again.");c(e[1],n[1]),a.success("AI content generated!"),l()}else c(u.trim()),a.success("AI comment generated!"),l()}catch(n){const e=n.message||"Failed to generate content. Please try again.";f(e),a.error(e)}finally{m(!1)}}},children:[t.jsx("label",{className:"block text-sm font-medium text-dark-grey dark:text-gray-300 mb-2",children:y}),"post"===i?t.jsx("input",{type:"text",className:"w-full bg-gray-100 dark:bg-grey border border-gray-200 dark:border-grey rounded-md p-2.5 text-sm dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4",value:d,onChange:e=>u(e.target.value),placeholder:"e.g., 'The future of space travel'",required:!0}):t.jsxs("div",{className:"border border-gray-200 dark:border-grey rounded-md p-3 mb-4 bg-gray-50 dark:bg-grey max-h-32 overflow-y-auto",children:[t.jsx("p",{className:"text-sm font-semibold text-dark-grey dark:text-white line-clamp-1",children:r.title}),t.jsx("p",{className:"text-xs text-gray-600 dark:text-gray-400 line-clamp-2",children:r.content})]}),t.jsx("div",{className:"flex justify-end",children:t.jsxs("button",{type:"submit",disabled:h||"post"===i&&!d.trim(),className:"btn-dark text-sm flex items-center justify-center disabled:opacity-50",children:[h?t.jsx(o,{}):t.jsx("i",{className:"fi fi-rr-sparkles mr-2"}),t.jsx("span",{children:h?"Generating...":x})]})})]})]})})})},pe=()=>{var u;const h=i(),{userAuth:m}=e.useContext(r),[g,f]=e.useState({communityName:"",title:"",content:"",postType:"text",url:"",image:""}),[p,y]=e.useState([]),[x,C]=e.useState(!0),[b,E]=e.useState(!1),[v,N]=e.useState(!1),[O,_]=e.useState(!1);e.useEffect(()=>{if(!(null==m?void 0:m.access_token))return;(async()=>{C(!0);try{const{data:e}=await c.get("/readit/user/communities");y(e||[])}catch(e){a.error("Could not load your communities.")}finally{C(!1)}})()},[null==m?void 0:m.access_token]);return(null==m?void 0:m.access_token)?t.jsxs("div",{className:"max-w-4xl mx-auto p-4 md:p-8",children:[t.jsxs(l,{children:[t.jsx("title",{children:"Create Post | Readit"}),t.jsx("meta",{name:"description",content:"Create a new post - share text, images, or links with the community"})]}),t.jsx(n,{children:O&&t.jsx(fe,{mode:"post",onClose:()=>_(!1),onGenerate:(e,t)=>{f(n=>({...n,title:e||n.title,content:t||n.content})),a.success("AI content generated!")}})}),t.jsxs(s.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},className:"bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden",children:[t.jsx("div",{className:"bg-gradient-to-r from-orange-500 to-orange-700 p-6 text-white",children:t.jsxs("div",{className:"flex items-center gap-4",children:[t.jsx("div",{className:"bg-white/20 p-3 rounded-xl backdrop-blur-sm",children:t.jsx("i",{className:"fi fi-rr-edit text-2xl"})}),t.jsxs("div",{children:[t.jsx("h1",{className:"text-2xl font-bold leading-tight",children:"Create a Post"}),t.jsx("p",{className:"text-orange-100 text-sm",children:"Share with the community or post personally"})]})]})}),t.jsxs("form",{onSubmit:async e=>{var t,n;if(e.preventDefault(),!g.title.trim())return a.error("Title is required");if(g.title.length>300)return a.error("Title too long");N(!0);const s=g.communityName?`/readit/c/${g.communityName}/posts`:"/readit/posts/personal",o={title:g.title,content:g.content,postType:g.postType,url:g.url,image:g.image};try{const{data:e}=await c.post(s,o);a.success("Post created successfully!"),h(`/readit/post/${e._id}`)}catch(i){a.error((null==(n=null==(t=i.response)?void 0:t.data)?void 0:n.error)||"Failed to create post.")}finally{N(!1)}},className:"p-6 md:p-8 space-y-6",children:[t.jsxs("div",{children:[t.jsx("label",{htmlFor:"communityName",className:"block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2",children:"Post to Community (Optional)"}),t.jsxs("div",{className:"relative",children:[t.jsx("i",{className:"fi fi-rr-users absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"}),t.jsxs("select",{id:"communityName",name:"communityName",value:g.communityName,onChange:e=>f(t=>({...t,communityName:e.target.value})),className:"input-box pl-10 appearance-none cursor-pointer",disabled:x,children:[t.jsxs("option",{value:"",children:["Post personally (u/",null==(u=m.personal_info)?void 0:u.username,")"]}),p.map(e=>t.jsxs("option",{value:e.name,children:["c/",e.name]},e._id))]}),t.jsx("i",{className:"fi fi-rr-angle-small-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"})]})]}),t.jsxs("div",{children:[t.jsxs("div",{className:"flex items-center justify-between mb-2",children:[t.jsxs("label",{htmlFor:"title",className:"block text-sm font-bold text-gray-700 dark:text-gray-200",children:["Title ",t.jsx("span",{className:"text-red-500",children:"*"})]}),t.jsxs("button",{type:"button",onClick:()=>_(!0),className:"flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm transition-colors",children:[t.jsx("i",{className:"fi fi-rr-sparkles text-xs"}),"AI Assist"]})]}),t.jsx("input",{type:"text",id:"title",name:"title",value:g.title,onChange:e=>f(t=>({...t,title:e.target.value})),placeholder:"An interesting title that grabs attention...",className:"input-box text-lg font-semibold placeholder:font-normal focus:ring-2 focus:ring-orange-500",maxLength:300,required:!0}),t.jsxs("div",{className:"flex justify-between text-xs text-gray-400 mt-1",children:[t.jsxs("span",{children:["Post type: ",t.jsx("span",{className:"font-bold capitalize",children:g.postType})]}),t.jsxs("span",{children:[g.title.length,"/300"]})]})]}),t.jsxs("div",{className:"space-y-4",children:[t.jsxs("div",{children:[t.jsx("label",{className:"block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2",children:"Content"}),t.jsx("textarea",{name:"content",value:g.content,onChange:e=>f(t=>({...t,content:e.target.value})),placeholder:"Share your thoughts, paste a URL, or upload an image...",className:"input-box min-h-[200px] resize-y text-sm leading-relaxed transition-all duration-200"})]}),t.jsx(n,{children:g.image&&t.jsx(s.div,{initial:{opacity:0,height:0},animate:{opacity:1,height:"auto"},exit:{opacity:0,height:0},className:"relative",children:t.jsxs("div",{className:"border-2 border-dashed border-green-200 dark:border-green-800 rounded-xl p-4 bg-green-50 dark:bg-green-900/20",children:[t.jsxs("div",{className:"flex items-center justify-between mb-2",children:[t.jsxs("span",{className:"text-sm font-medium text-green-700 dark:text-green-300",children:[t.jsx("i",{className:"fi fi-rr-picture mr-2"}),"Image Uploaded"]}),t.jsx("button",{type:"button",onClick:()=>{f(e=>({...e,image:""}))},className:"text-red-500 hover:text-red-700 text-sm font-medium",children:"Remove"})]}),t.jsx("img",{src:g.image,alt:"Post preview",className:"max-h-64 rounded-lg mx-auto shadow-md"})]})})})]}),t.jsxs("div",{className:"flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100 dark:border-gray-700",children:[t.jsxs("label",{className:"flex items-center justify-center gap-2 py-3 rounded-xl font-bold cursor-pointer flex-1 transition-all "+(b?"bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed":"btn-light hover:bg-gray-100 dark:hover:bg-gray-700"),children:[b?t.jsx(o,{}):t.jsxs(t.Fragment,{children:[t.jsx("i",{className:"fi fi-rr-camera"}),"Upload Image"]}),t.jsx("input",{type:"file",accept:"image/*",hidden:!0,onChange:async e=>{const t=e.target.files[0];if(t){if(t.size>5242880)return a.error("Image size should be less than 5MB");E(!0);try{const e=await d(t),n="string"==typeof e?e:e.url;f(e=>({...e,image:n})),a.success("Image uploaded successfully!")}catch(n){a.error("Failed to upload image")}finally{E(!1)}}},disabled:b})]}),t.jsx("button",{type:"button",onClick:()=>h(-1),className:"flex-1 btn-light py-3 rounded-xl font-bold text-gray-500",disabled:v,children:"Cancel"}),t.jsx("button",{type:"submit",disabled:v||b||!g.title.trim(),className:"flex-[2] bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-red-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-orange-500/25",children:v?t.jsx(o,{}):t.jsxs(t.Fragment,{children:[t.jsx("i",{className:"fi fi-rr-paper-plane"}),"Create Post"]})})]})]})]})]}):t.jsxs("div",{className:"max-w-2xl mx-auto p-8 flex flex-col items-center justify-center min-h-[60vh]",children:[t.jsx("div",{className:"bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-full p-6 mb-6",children:t.jsx("i",{className:"fi fi-rr-lock text-4xl text-yellow-600 dark:text-yellow-400"})}),t.jsx("h2",{className:"text-2xl font-bold text-gray-900 dark:text-white mb-2",children:"Authentication Required"}),t.jsx("p",{className:"text-gray-500 dark:text-gray-400 mb-6",children:"Please sign in to share your thoughts."}),t.jsx("button",{onClick:()=>h("/signin"),className:"btn-dark px-8",children:"Sign In"})]})};export{pe as default};
