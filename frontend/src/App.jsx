import React, { useState, useRef } from 'react'
import { chat } from './api'

function Message({ role, text }){
  return (
    <div className={"msg " + (role === 'user' ? 'user' : 'bot')}>
      <pre style={{margin:0,whiteSpace:'pre-wrap'}}>{text}</pre>
    </div>
  )
}

function Recommendations({ items = [] }){
  if(!items.length) return null;
  return (
    <div className="card">
      <h3>Recommendations</h3>
      <ul>
        {items.map((r,i)=> (
          <li key={i}><strong>{r.title}</strong>{r.reason ? ` — ${r.reason}` : ''}</li>
        ))}
      </ul>
    </div>
  )
}

function Accommodations({ items = [] }){
  if(!items.length) return null;
  return (
    <div className="card">
      <h3>Accommodations</h3>
      {items.map((a,i)=> (
        <div key={i} className="hotel">
          <div className="hotel-left">
            <div className="hotel-name">{a.name}</div>
            <div className="hotel-meta">{a.city || ''} • {a.price_range || 'N/A'} • ⭐ {a.rating ?? '—'}</div>
          </div>
          <div className="hotel-right">
            <a href={a.booking_link || '#'} target="_blank" rel="noreferrer">Book</a>
          </div>
        </div>
      ))}
    </div>
  )
}

function Itinerary({ itinerary = [] }){
  if(!itinerary.length) return null;
  return (
    <div className="card">
      <h3>Itinerary</h3>
      {itinerary.map((dayObj, idx)=> (
        <div key={idx} className="it-day">
          <strong>Day {dayObj.day ?? idx+1}</strong>
          <ul>
            {(dayObj.activities || []).map((act,j)=> (
              <li key={j}>{act.time ? `${act.time} — ` : ''}{act.activity}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export default function App(){
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hello! I'm your travel assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastStructured, setLastStructured] = useState(null);
  const bottomRef = useRef(null);

  function pushMessage(msg){
    setMessages(prev => [...prev, msg]);
  }

  function scrollToBottom(){
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function send(){
    if(!input.trim()) return;
    const userMsg = { role: 'user', text: input.trim() };
    pushMessage(userMsg);
    setInput('');
    setLoading(true);
    try{
      const bot = await chat([...messages, userMsg]);
      if(bot.answer) pushMessage({ role: 'assistant', text: bot.answer });
      setLastStructured(bot);

      if(bot.recommendations && bot.recommendations.length){
        pushMessage({ role: 'assistant', text: 'Recommendations:\n' + bot.recommendations.map(r=>r.title).join('\n') });
      }
      if(bot.accommodations && bot.accommodations.length){
        pushMessage({ role: 'assistant', text: 'Accommodations:\n' + bot.accommodations.map(a=>a.name).join('\n') });
      }
    }catch(e){
      pushMessage({ role: 'assistant', text: 'Error: ' + (e?.response?.data?.error || e.message) });
      setLastStructured(null);
    }finally{
      setLoading(false);
      scrollToBottom();
    }
  }

  function onKeyDown(e){
    if(e.key === 'Enter' && !e.shiftKey){
      e.preventDefault();
      send();
    }
  }

  return (
    <main>
      <h1>TDX360 Travel Assistant</h1>
      <section className="chat-window" aria-live="polite">
        {messages.map((m,i) => <Message key={i} role={m.role} text={m.text} />)}
        <div ref={bottomRef} />
      </section>
      <form onSubmit={e => { e.preventDefault(); send(); }}>
        <textarea
          rows={2}
          value={input}
          placeholder="Type your message here..."
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={loading}
          aria-label="Chat message input"
        />
        <button type="submit" disabled={loading || !input.trim()}>
          {loading ? '...' : 'Send'}
        </button>
      </form>
      {lastStructured && (
        <>
          <Recommendations items={lastStructured.recommendations || []} />
          <Accommodations items={lastStructured.accommodations || []} />
          <Itinerary itinerary={lastStructured.itinerary || []} />
        </>
      )}
    </main>
  );
}