function buildPrompt(contextDocs, userQuery){
  const contextText = contextDocs.map((d,i)=> `[[${i+1}] ${d.title} | id:${d.id}]
${d.body}`).join('\n\n');
  return `SYSTEM: You are a helpful travel assistant. Use ONLY the provided CONTEXT for factual claims.

CONTEXT:
${contextText}

USER QUERY: ${userQuery}

INSTRUCTIONS:
Return valid JSON only with keys: answer (string), recommendations (array of {title, reason}), accommodations (array), itinerary (array), sources (array of {source_id, title}), needs_tool (bool).`;
}

module.exports = { buildPrompt };
