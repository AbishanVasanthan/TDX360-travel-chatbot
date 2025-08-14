import axios from 'axios';
const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8787';

export async function chat(history){
  const res = await axios.post(`${BACKEND}/api/chat`, { history });
  return res.data;
}